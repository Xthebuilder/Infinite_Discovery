import { http, HttpResponse, delay } from "msw";

import { getClusterItems, getClusters } from "@/lib/feed/mock-data";

const pageSize = 20;
const itemPageSize = 12;

export const handlers = [
  http.get("/api/feed/clusters", async ({ request }) => {
    await delay(90);
    const url = new URL(request.url);
    const cursor = Number(url.searchParams.get("cursor") ?? 0);

    return HttpResponse.json(getClusters(cursor, pageSize));
  }),
  http.get("/api/feed/cluster/:clusterId/items", async ({ params, request }) => {
    await delay(70);
    const url = new URL(request.url);
    const cursor = Number(url.searchParams.get("cursor") ?? 0);

    return HttpResponse.json(
      getClusterItems(String(params.clusterId), cursor, itemPageSize),
    );
  }),
];
