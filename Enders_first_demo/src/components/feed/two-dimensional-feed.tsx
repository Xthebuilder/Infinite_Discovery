"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { A11y, Keyboard, Mousewheel, Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/virtual";

import { ClusterSlide } from "@/components/feed/cluster-slide";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useAnalytics } from "@/lib/analytics/analytics";
import { clusterListQuery, prefetchNeighborhood } from "@/lib/feed/queries";
import { useFeedNavigationStore } from "@/lib/feed/store";

export function TwoDimensionalFeed() {
  useLockBodyScroll();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { track } = useAnalytics();
  const verticalSwiperRef = useRef<SwiperInstance | null>(null);
  const virtualRef = useRef<HTMLDivElement | null>(null);
  const [activeY, setActiveY] = useState(0);
  const [activeXByCluster, setActiveXByCluster] = useState<Record<string, number>>(
    {},
  );
  const setLocation = useFeedNavigationStore((state) => state.setLocation);
  const markHydratedFromUrl = useFeedNavigationStore(
    (state) => state.markHydratedFromUrl,
  );
  const requestedClusterId = searchParams.get("cluster");
  const requestedItemId = searchParams.get("item");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(clusterListQuery);
  const clusters = useMemo(
    () => data?.pages.flatMap((page) => page.clusters) ?? [],
    [data],
  );
  const activeCluster = clusters[activeY];
  const clusterIds = useMemo(() => clusters.map((cluster) => cluster.id), [clusters]);
  const clusterVirtualizer = useVirtualizer({
    count: 1200,
    getScrollElement: () => virtualRef.current,
    estimateSize: () => globalThis.innerHeight || 844,
    overscan: 4,
  });

  useEffect(() => {
    if (!requestedClusterId || !clusters.length) {
      return;
    }

    const requestedY = clusters.findIndex(
      (cluster) => cluster.id === requestedClusterId,
    );

    if (requestedY >= 0) {
      setActiveY(requestedY);
      verticalSwiperRef.current?.slideTo(requestedY, 0);
      markHydratedFromUrl();
      return;
    }

    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [
    clusters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markHydratedFromUrl,
    requestedClusterId,
  ]);

  useEffect(() => {
    if (!activeCluster) {
      return;
    }

    prefetchNeighborhood(queryClient, clusterIds, activeY);

    if (hasNextPage && activeY >= clusters.length - 5 && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [
    activeCluster,
    activeY,
    clusterIds,
    clusters.length,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    queryClient,
  ]);

  const commitLocation = useCallback(
    (x: number, y: number, itemId: string) => {
      const cluster = clusters[y];

      if (!cluster) {
        return;
      }

      setActiveXByCluster((previous) => ({ ...previous, [cluster.id]: x }));
      setLocation({ x, y, clusterId: cluster.id, itemId });
      track({
        name: "feed_location_changed",
        properties: {
          x,
          y,
          clusterId: cluster.id,
          itemId,
        },
      });

      const params = new URLSearchParams(searchParams.toString());
      params.set("cluster", cluster.id);
      params.set("item", itemId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [clusters, pathname, router, searchParams, setLocation, track],
  );

  if (isLoading) {
    return (
      <main className="flex h-dvh items-center justify-center bg-black text-white">
        <Loader2 className="h-7 w-7 animate-spin" />
      </main>
    );
  }

  return (
    <main className="feed-shell h-dvh w-full overflow-hidden bg-black text-white">
      <div ref={virtualRef} className="sr-only" aria-hidden="true">
        {clusterVirtualizer.getVirtualItems().length} virtual cluster slots prepared
      </div>

      <Swiper
        modules={[A11y, Keyboard, Mousewheel, Virtual]}
        className="vertical-feed-swiper h-full w-full"
        direction="vertical"
        virtual
        allowTouchMove
        keyboard={{ enabled: true }}
        mousewheel={{ forceToAxis: true }}
        resistanceRatio={0.72}
        threshold={6}
        touchAngle={35}
        touchStartPreventDefault={false}
        passiveListeners={false}
        slidesPerView={1}
        initialSlide={activeY}
        onSwiper={(swiper) => {
          verticalSwiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          const y = swiper.activeIndex;
          const cluster = clusters[y];
          setActiveY(y);

          if (cluster) {
            setLocation({
              x: activeXByCluster[cluster.id] ?? 0,
              y,
              clusterId: cluster.id,
              itemId: requestedItemId ?? "",
            });
          }
        }}
        onReachEnd={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
      >
        {clusters.map((cluster, y) => (
          <SwiperSlide key={cluster.id} virtualIndex={y} className="h-full w-full">
            <ClusterSlide
              cluster={cluster}
              y={y}
              activeY={activeY}
              activeX={activeXByCluster[cluster.id] ?? 0}
              requestedItemId={
                cluster.id === requestedClusterId ? requestedItemId : undefined
              }
              onItemChange={(x, itemId) => commitLocation(x, y, itemId)}
            />
          </SwiperSlide>
        ))}
        {isFetchingNextPage ? (
          <SwiperSlide virtualIndex={clusters.length} className="h-full w-full">
            <div className="flex h-full items-center justify-center bg-black text-white">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          </SwiperSlide>
        ) : null}
      </Swiper>
    </main>
  );
}
