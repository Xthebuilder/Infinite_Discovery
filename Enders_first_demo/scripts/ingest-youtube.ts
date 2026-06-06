/**
 * Fetches YouTube videos for each topic region and upserts them into Supabase.
 * Run with: npx tsx scripts/ingest-youtube.ts
 *
 * Required env vars:
 *   DATABASE_URL     — Supabase connection string
 *   YOUTUBE_API_KEY  — Google Cloud YouTube Data API v3 key
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const REGIONS: { id: string; title: string; query: string; score: number }[] =
  [
    { id: "region-cooking", title: "Cooking", query: "cooking recipe short", score: 1.0 },
    { id: "region-gym",     title: "Gym",     query: "gym workout short",    score: 0.99 },
    { id: "region-gaming",  title: "Gaming",  query: "gaming highlights short", score: 0.98 },
    { id: "region-beauty",  title: "Beauty",  query: "beauty makeup tutorial short", score: 0.97 },
    { id: "region-travel",  title: "Travel",  query: "travel vlog short",    score: 0.96 },
    { id: "region-finance", title: "Finance", query: "personal finance tips short", score: 0.95 },
    { id: "region-comedy",  title: "Comedy",  query: "comedy skit short",    score: 0.94 },
    { id: "region-music",   title: "Music",   query: "music performance short", score: 0.93 },
  ];

const VIDEOS_PER_REGION = 20;
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY env var");
  process.exit(1);
}

async function searchYouTube(query: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoDuration", "short");
  url.searchParams.set("maxResults", String(VIDEOS_PER_REGION));
  url.searchParams.set("key", API_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ items: YouTubeSearchItem[] }>;
}

type YouTubeSearchItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    thumbnails: { high: { url: string } };
  };
};

async function getVideoStats(videoIds: string[]) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", API_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube stats error: ${res.status}`);
  const data = await res.json() as {
    items: { id: string; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }[]
  };
  return Object.fromEntries(data.items.map((v) => [v.id, v.statistics]));
}

async function main() {
  for (const region of REGIONS) {
    console.log(`\nIngesting: ${region.title}`);

    await prisma.cluster.upsert({
      where: { id: region.id },
      update: { title: region.title, score: region.score },
      create: { id: region.id, title: region.title, score: region.score },
    });

    const { items } = await searchYouTube(region.query);
    const videoIds = items.map((v) => v.id.videoId);
    const stats = await getVideoStats(videoIds);

    let rank = 0;
    for (const item of items) {
      const vid = item.id.videoId;
      const s = item.snippet;
      const st = stats[vid] ?? {};

      await prisma.clusterItem.upsert({
        where: { id: vid },
        update: {
          title: s.title,
          videoUrl: `https://www.youtube.com/embed/${vid}`,
          creatorName: s.channelTitle,
          description: s.description.slice(0, 200),
          posterUrl: s.thumbnails.high.url,
          score: 1 - rank / items.length,
          likes: Number(st.likeCount ?? 0),
          comments: Number(st.commentCount ?? 0),
          shares: 0,
          clusterId: region.id,
        },
        create: {
          id: vid,
          clusterId: region.id,
          title: s.title,
          videoUrl: `https://www.youtube.com/embed/${vid}`,
          creatorName: s.channelTitle,
          description: s.description.slice(0, 200),
          posterUrl: s.thumbnails.high.url,
          score: 1 - rank / items.length,
          likes: Number(st.likeCount ?? 0),
          comments: Number(st.commentCount ?? 0),
          shares: 0,
        },
      });
      console.log(`  [${++rank}/${items.length}] ${s.title.slice(0, 60)}`);
    }
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
