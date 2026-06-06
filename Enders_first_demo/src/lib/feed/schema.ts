import { z } from "zod";

export const feedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  videoUrl: z.string().url(),
  creatorId: z.string(),
  creatorName: z.string(),
  description: z.string(),
  posterUrl: z.string().url(),
  score: z.number(),
  stats: z.object({
    likes: z.number().int().nonnegative(),
    comments: z.number().int().nonnegative(),
    shares: z.number().int().nonnegative(),
  }),
});

export const clusterSchema = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number(),
  itemCount: z.number().int().nonnegative(),
  items: z.array(feedItemSchema).optional(),
});

export const feedGraphSchema = z.object({
  clusters: z.array(clusterSchema),
});

export const paginatedClustersSchema = z.object({
  clusters: z.array(clusterSchema),
  nextCursor: z.number().nullable(),
});

export const paginatedItemsSchema = z.object({
  clusterId: z.string(),
  items: z.array(feedItemSchema),
  nextCursor: z.number().nullable(),
});

export type FeedItem = z.infer<typeof feedItemSchema>;
export type Cluster = z.infer<typeof clusterSchema>;
export type FeedGraph = z.infer<typeof feedGraphSchema>;
export type PaginatedClusters = z.infer<typeof paginatedClustersSchema>;
export type PaginatedItems = z.infer<typeof paginatedItemsSchema>;

export type FeedLocation = {
  x: number;
  y: number;
  clusterId: string;
  itemId: string;
};
