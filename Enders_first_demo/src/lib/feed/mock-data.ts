// Drop-in replacement for the original mock-data.ts.
// Same exports (mockClusters / getClusters / getClusterItems), but the data is
// now derived from our semantic map (map-graph.json) instead of random topics:
//   region  -> cluster (vertical)   tile -> item (horizontal)   centroid -> item 0
// Nothing else in the app changes; the route handlers and MSW handlers keep
// calling these same functions.
import graph from "./map-graph.json";
import type { Cluster, FeedItem } from "./schema";

type FeedGraphFile = {
  clusters: Cluster[];
  items: Record<string, FeedItem[]>;
  meta?: { regions: number; centroids: Record<string, string> };
};

const data = graph as unknown as FeedGraphFile;

export const mockClusters: Cluster[] = data.clusters;

// The representative (centroid) tile of each region — item 0 of each cluster.
// This is the "preview clip" concept from the map design, surfaced as the first
// thing you see when you land on a topic.
export const regionCentroids: Record<string, string> = data.meta?.centroids ?? {};

export function getClusters(cursor = 0, limit = 20) {
  const start = Math.max(0, cursor);
  const end = Math.min(start + limit, mockClusters.length);

  return {
    clusters: mockClusters.slice(start, end),
    nextCursor: end < mockClusters.length ? end : null,
  };
}

export function getClusterItems(clusterId: string, cursor = 0, limit = 12) {
  const items = data.items[clusterId] ?? [];
  const start = Math.max(0, cursor);
  const end = Math.min(start + limit, items.length);

  return {
    clusterId,
    items: items.slice(start, end),
    nextCursor: end < items.length ? end : null,
  };
}
