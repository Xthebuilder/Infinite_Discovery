import {
  paginatedClustersSchema,
  paginatedItemsSchema,
  type PaginatedClusters,
  type PaginatedItems,
} from "./schema";

async function getJson<T>(url: string, parse: (value: unknown) => T) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return parse(await response.json());
}

export function fetchClusters(cursor = 0): Promise<PaginatedClusters> {
  return getJson(
    `/api/feed/clusters?cursor=${cursor}`,
    paginatedClustersSchema.parse,
  );
}

export function fetchClusterItems(
  clusterId: string,
  cursor = 0,
): Promise<PaginatedItems> {
  return getJson(
    `/api/feed/cluster/${clusterId}/items?cursor=${cursor}`,
    paginatedItemsSchema.parse,
  );
}
