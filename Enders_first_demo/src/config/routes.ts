export const routes = {
  home: "/",
  feed: "/feed",
} as const;

export function feedDeepLink(clusterId: string, itemId: string) {
  const params = new URLSearchParams({ cluster: clusterId, item: itemId });

  return `${routes.feed}?${params.toString()}`;
}
