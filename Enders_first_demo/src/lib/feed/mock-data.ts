import type { Cluster, FeedItem } from "./schema";

const topics = [
  "Technology",
  "Travel",
  "Gaming",
  "Design",
  "Music",
  "Fitness",
  "Food",
  "Science",
  "Film",
  "Finance",
];

const videoUrls = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
];

const posterUrls = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
];

function itemFor(clusterIndex: number, itemIndex: number): FeedItem {
  const topic = topics[clusterIndex % topics.length];
  const id = `${topic.toLowerCase()}-${clusterIndex}-${itemIndex}`;

  return {
    id,
    title: `${topic}-${itemIndex + 1}`,
    videoUrl: videoUrls[(clusterIndex + itemIndex) % videoUrls.length],
    creatorId: `creator-${(clusterIndex * 7 + itemIndex) % 53}`,
    creatorName: `@${topic.toLowerCase()}lab${itemIndex % 9}`,
    description: `${topic} clip ${itemIndex + 1} from a generated graph cluster.`,
    posterUrl: posterUrls[(clusterIndex + itemIndex) % posterUrls.length],
    score: Number((1 - itemIndex / 150).toFixed(4)),
    stats: {
      likes: 1200 + clusterIndex * 37 + itemIndex * 111,
      comments: 40 + ((clusterIndex + itemIndex) % 90),
      shares: 12 + ((clusterIndex * itemIndex + 3) % 40),
    },
  };
}

export const mockClusters: Cluster[] = Array.from({ length: 1200 }, (_, y) => {
  const topic = topics[y % topics.length];

  return {
    id: `cluster-${y}-${topic.toLowerCase()}`,
    title: y < 3 ? ["Technology", "Travel", "Gaming"][y] : `${topic} ${y + 1}`,
    score: Number((1 - y / 2000).toFixed(4)),
    itemCount: 120,
  };
});

export function getClusterItems(clusterId: string, cursor = 0, limit = 12) {
  const clusterIndex = Math.max(
    0,
    mockClusters.findIndex((cluster) => cluster.id === clusterId),
  );
  const start = Math.max(0, cursor);
  const end = Math.min(start + limit, 120);
  const items = Array.from({ length: end - start }, (_, index) =>
    itemFor(clusterIndex, start + index),
  );

  return {
    clusterId,
    items,
    nextCursor: end < 120 ? end : null,
  };
}

export function getClusters(cursor = 0, limit = 20) {
  const start = Math.max(0, cursor);
  const end = Math.min(start + limit, mockClusters.length);

  return {
    clusters: mockClusters.slice(start, end),
    nextCursor: end < mockClusters.length ? end : null,
  };
}
