import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const cursor = Number(request.nextUrl.searchParams.get("cursor") ?? 0);
  const limit = 20;

  const clusters = await prisma.cluster.findMany({
    orderBy: { score: "desc" },
    skip: cursor,
    take: limit + 1,
    include: { _count: { select: { items: true } } },
  });

  const hasMore = clusters.length > limit;

  return NextResponse.json({
    clusters: clusters.slice(0, limit).map((c) => ({
      id: c.id,
      title: c.title,
      score: c.score,
      itemCount: c._count.items,
    })),
    nextCursor: hasMore ? cursor + limit : null,
  });
}
