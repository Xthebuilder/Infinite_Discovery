/**
 * Fetches YouTube videos for each topic region and upserts them into Supabase.
 * Run with: npx tsx scripts/ingest-youtube.ts
 *
 * Required env vars:
 *   POSTGRES_PRISMA_URL  — Supabase session pooler connection string
 *   YOUTUBE_API_KEY      — Google Cloud YouTube Data API v3 key
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const REGIONS: { id: string; title: string; query: string; score: number }[] = [
  { id: "region-cooking",       title: "Cooking",       query: "cooking recipe short",                score: 1.00 },
  { id: "region-gym",           title: "Gym",           query: "gym workout short",                   score: 0.99 },
  { id: "region-gaming",        title: "Gaming",        query: "gaming highlights short",             score: 0.98 },
  { id: "region-beauty",        title: "Beauty",        query: "beauty makeup tutorial short",        score: 0.97 },
  { id: "region-travel",        title: "Travel",        query: "travel vlog short",                   score: 0.96 },
  { id: "region-finance",       title: "Finance",       query: "personal finance tips short",         score: 0.95 },
  { id: "region-comedy",        title: "Comedy",        query: "comedy skit short",                   score: 0.94 },
  { id: "region-music",         title: "Music",         query: "music performance short",             score: 0.93 },
  { id: "region-fashion",       title: "Fashion",       query: "fashion outfit style short",          score: 0.92 },
  { id: "region-dance",         title: "Dance",         query: "dance choreography short",            score: 0.91 },
  { id: "region-sports",        title: "Sports",        query: "sports highlights short",             score: 0.90 },
  { id: "region-pets",          title: "Pets",          query: "cute pets animals funny short",       score: 0.89 },
  { id: "region-diy",           title: "DIY",           query: "diy craft project short",             score: 0.88 },
  { id: "region-tech",          title: "Tech",          query: "tech gadget review short",            score: 0.87 },
  { id: "region-wellness",      title: "Wellness",      query: "yoga meditation wellness short",      score: 0.86 },
  { id: "region-food-reviews",  title: "Food Reviews",  query: "food review mukbang short",           score: 0.85 },
  { id: "region-outdoors",      title: "Outdoors",      query: "outdoor adventure nature short",      score: 0.84 },
  { id: "region-cars",          title: "Cars",          query: "cars automotive driving short",       score: 0.83 },
  { id: "region-art",           title: "Art",           query: "art drawing painting timelapse short",score: 0.82 },
  { id: "region-education",     title: "Education",     query: "learn something new interesting short",score: 0.81 },
  { id: "region-parenting",     title: "Parenting",     query: "parenting kids funny moments short",  score: 0.80 },
  { id: "region-real-estate",   title: "Real Estate",   query: "real estate house tour short",        score: 0.79 },
  { id: "region-photography",   title: "Photography",   query: "photography tips cinematic short",    score: 0.78 },
  { id: "region-motivation",    title: "Motivation",    query: "motivation mindset success short",    score: 0.77 },
  { id: "region-relationships", title: "Relationships", query: "relationship advice dating short",    score: 0.76 },
];

const VIDEOS_PER_REGION = 10;
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
  console.log("Clearing existing data...");
  await prisma.clusterItem.deleteMany();
  await prisma.cluster.deleteMany();
  console.log("Cleared.\n");

  for (const region of REGIONS) {
    console.log(`Ingesting: ${region.title}`);

    await prisma.cluster.create({
      data: { id: region.id, title: region.title, score: region.score },
    });

    const { items } = await searchYouTube(region.query);
    const videoIds = items.map((v) => v.id.videoId);
    const stats = await getVideoStats(videoIds);

    let rank = 0;
    for (const item of items) {
      const vid = item.id.videoId;
      const s = item.snippet;
      const st = stats[vid] ?? {};

      try {
        await prisma.clusterItem.create({
          data: {
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
      } catch (e: any) {
        if (e?.code === "P2002") {
          console.log(`  [skip] duplicate video ${vid}`);
        } else {
          throw e;
        }
      }
    }
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
