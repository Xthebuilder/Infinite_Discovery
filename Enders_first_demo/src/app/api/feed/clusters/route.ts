import { NextResponse, type NextRequest } from "next/server";

import { getClusters } from "@/lib/feed/mock-data";

export function GET(request: NextRequest) {
  const cursor = Number(request.nextUrl.searchParams.get("cursor") ?? 0);

  return NextResponse.json(getClusters(cursor, 20));
}
