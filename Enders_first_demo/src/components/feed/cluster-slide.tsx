"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { A11y, Keyboard, Mousewheel, Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";

import { FeedVideoCard } from "@/components/feed/feed-video-card";
import { Button } from "@/components/ui/button";
import { clusterItemsQuery } from "@/lib/feed/queries";
import type { Cluster } from "@/lib/feed/schema";

type ClusterSlideProps = {
  cluster: Cluster;
  y: number;
  activeY: number;
  activeX: number;
  requestedItemId?: string | null;
  onItemChange: (x: number, itemId: string) => void;
};

export function ClusterSlide({
  cluster,
  y,
  activeY,
  activeX,
  requestedItemId,
  onItemChange,
}: ClusterSlideProps) {
  const queryClient = useQueryClient();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const virtualRef = useRef<HTMLDivElement | null>(null);
  const isActiveCluster = activeY === y;
  const shouldLoadItems = Math.abs(activeY - y) <= 1;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      ...clusterItemsQuery(cluster.id),
      enabled: shouldLoadItems,
    });
  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const itemVirtualizer = useVirtualizer({
    horizontal: true,
    count: cluster.itemCount,
    getScrollElement: () => virtualRef.current,
    estimateSize: () => globalThis.innerWidth || 390,
    overscan: 3,
  });
  const virtualItems = itemVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!isActiveCluster || !requestedItemId || !items.length) {
      return;
    }

    const requestedIndex = items.findIndex((item) => item.id === requestedItemId);

    if (requestedIndex >= 0 && requestedIndex !== swiperRef.current?.activeIndex) {
      swiperRef.current?.slideTo(requestedIndex, 0);
    }
  }, [isActiveCluster, items, requestedItemId]);

  useEffect(() => {
    if (!isActiveCluster || !items[activeX]) {
      return;
    }

    const nextItem = items[activeX + 1];
    if (nextItem) {
      void queryClient.prefetchQuery({
        queryKey: ["feed", "video", nextItem.id],
        queryFn: () => Promise.resolve(nextItem),
        staleTime: 60_000,
      });
    }

    if (hasNextPage && activeX >= items.length - 4 && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [
    activeX,
    fetchNextPage,
    hasNextPage,
    isActiveCluster,
    isFetchingNextPage,
    items,
    queryClient,
  ]);

  return (
    <section className="relative h-dvh w-full bg-black" aria-label={cluster.title}>
      <div ref={virtualRef} className="sr-only" aria-hidden="true">
        {virtualItems.length} virtual item slots prepared
      </div>

      {isLoading ? (
        <div className="flex h-full items-center justify-center text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Swiper
          modules={[A11y, Keyboard, Mousewheel, Virtual]}
          className="horizontal-feed-swiper h-full w-full"
          direction="horizontal"
          nested
          virtual
          allowTouchMove
          keyboard={{ enabled: isActiveCluster }}
          mousewheel={{ forceToAxis: true }}
          resistanceRatio={0.72}
          threshold={6}
          touchAngle={35}
          touchStartPreventDefault={false}
          passiveListeners={false}
          slidesPerView={1}
          initialSlide={activeX}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            const item = items[swiper.activeIndex];
            if (item) {
              onItemChange(swiper.activeIndex, item.id);
            }
          }}
          onReachEnd={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
        >
          {items.map((item, x) => (
            <SwiperSlide key={item.id} virtualIndex={x} className="h-full w-full">
              <FeedVideoCard
                item={item}
                active={isActiveCluster && activeX === x}
                preload={isActiveCluster && (activeX === x + 1 || activeX + 1 === x)}
              />
            </SwiperSlide>
          ))}
          {isFetchingNextPage ? (
            <SwiperSlide virtualIndex={items.length} className="h-full w-full">
              <div className="flex h-full items-center justify-center bg-black text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </SwiperSlide>
          ) : null}
        </Swiper>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/55">
            y:{y} / x:{activeX}
          </p>
          <h1 className="text-lg font-semibold">{cluster.title}</h1>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-black/28 px-3 py-2 text-xs text-white/76 backdrop-blur sm:flex">
          <ChevronLeft className="h-4 w-4" />
          <span>{items.length} loaded</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {items.length > 1 ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 hidden items-center justify-between px-3 sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="pointer-events-auto rounded-full bg-black/24 text-white backdrop-blur"
            aria-label="Previous item"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="pointer-events-auto rounded-full bg-black/24 text-white backdrop-blur"
            aria-label="Next item"
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
