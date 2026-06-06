import { NextResponse, type NextRequest } from "next/server";

import { getClusterItems } from "@/lib/feed/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> },
) {
  const cursor = Number(request.nextUrl.searchParams.get("cursor") ?? 0);
  const { clusterId } = await params;

  return NextResponse.json(getClusterItems(clusterId, cursor, 12));
}
