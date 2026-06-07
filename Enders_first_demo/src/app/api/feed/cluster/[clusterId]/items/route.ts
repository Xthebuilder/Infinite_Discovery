import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 86400;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> },
) {
  const cursor = Number(request.nextUrl.searchParams.get("cursor") ?? 0);
  const { clusterId } = await params;
  const limit = 50;

  const items = await prisma.clusterItem.findMany({
    where: { clusterId },
    orderBy: { score: "desc" },
    skip: cursor,
    take: limit + 1,
  });

  return NextResponse.json(
    {
      clusterId,
      items: items.slice(0, limit).map((item) => ({
        id: item.id,
        title: item.title,
        videoUrl: item.videoUrl,
        creatorId: item.creatorName,
        creatorName: item.creatorName,
        description: item.description,
        posterUrl: item.posterUrl,
        score: item.score,
        stats: {
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
        },
      })),
      nextCursor: items.length > limit ? cursor + limit : null,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
