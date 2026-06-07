import {
  infiniteQueryOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

import { fetchClusterItems, fetchClusters } from "./api";

export const clusterListQuery = infiniteQueryOptions({
  queryKey: ["feed", "clusters"],
  queryFn: ({ pageParam }) => fetchClusters(Number(pageParam ?? 0)),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  staleTime: Infinity,
});

export function clusterItemsQuery(clusterId: string) {
  return infiniteQueryOptions({
    queryKey: ["feed", "cluster", clusterId, "items"],
    queryFn: ({ pageParam }) => fetchClusterItems(clusterId, Number(pageParam ?? 0)),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: Infinity,
    enabled: Boolean(clusterId),
  });
}

export function firstClusterItemsQuery(clusterId: string) {
  return queryOptions({
    queryKey: ["feed", "cluster", clusterId, "items", "first"],
    queryFn: () => fetchClusterItems(clusterId, 0),
    staleTime: Infinity,
    enabled: Boolean(clusterId),
  });
}

export function prefetchNeighborhood(
  queryClient: QueryClient,
  clusterIds: string[],
  activeY: number,
) {
  const nextClusterId = clusterIds[activeY + 1];
  const currentClusterId = clusterIds[activeY];

  if (nextClusterId) {
    void queryClient.prefetchInfiniteQuery(clusterItemsQuery(nextClusterId));
  }

  if (currentClusterId) {
    void queryClient.prefetchInfiniteQuery(clusterItemsQuery(currentClusterId));
  }
}
