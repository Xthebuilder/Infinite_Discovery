"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";

import { motion } from "framer-motion";
import { FeedVideoCard } from "@/components/feed/feed-video-card";
import { Button } from "@/components/ui/button";
import { clusterItemsQuery } from "@/lib/feed/queries";
import type { Cluster } from "@/lib/feed/schema";
import type { FeedScaleLevel } from "./two-dimensional-feed";

type ClusterSlideProps = {
  cluster: Cluster;
  y: number;
  activeY: number;
  activeX: number;
  scaleLevel: FeedScaleLevel;
  requestedItemId?: string | null;
  isPaused?: boolean;
  onItemChange: (x: number, itemId: string) => void;
  onSwiperReady?: (swiper: SwiperInstance | null) => void;
};

export function ClusterSlide({
  cluster,
  y,
  activeY,
  activeX,
  scaleLevel,
  requestedItemId,
  isPaused = false,
  onItemChange,
  onSwiperReady,
}: ClusterSlideProps) {
  const queryClient = useQueryClient();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const virtualRef = useRef<HTMLDivElement | null>(null);
  const isActiveCluster = activeY === y;
  const visibleRadius = scaleLevel.slidesPerView >= 5 ? 2 : 1;
  const shouldLoadItems = Math.abs(activeY - y) <= visibleRadius;
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
    overscan: 10,
  });
  const virtualItems = itemVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!isActiveCluster) return;
    onSwiperReady?.(swiperRef.current);
    return () => { onSwiperReady?.(null); };
  }, [isActiveCluster, onSwiperReady]);

  // Jump to a deep-linked item by id.
  useEffect(() => {
    if (!isActiveCluster || !requestedItemId || !items.length) return;
    const requestedIndex = items.findIndex((item) => item.id === requestedItemId);
    if (requestedIndex >= 0 && requestedIndex !== swiperRef.current?.realIndex) {
      swiperRef.current?.slideToLoop(requestedIndex, 0);
    }
  }, [isActiveCluster, items, requestedItemId]);

  // Sync Swiper position when activeX is changed programmatically (e.g. keyboard nav).
  useEffect(() => {
    if (!isActiveCluster || !items.length) return;
    const bounded = Math.min(activeX, items.length - 1);
    if (bounded >= 0 && bounded !== swiperRef.current?.realIndex) {
      swiperRef.current?.slideToLoop(bounded, 0);
    }
  }, [activeX, isActiveCluster, items.length]);

  // Re-sync after scale change (slidesPerView changes → Swiper needs update).
  useEffect(() => {
    swiperRef.current?.update();
    if (!isActiveCluster || !items.length) return;
    swiperRef.current?.slideToLoop(Math.min(activeX, items.length - 1), 0);
  }, [scaleLevel.slidesPerView]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isActiveCluster || !items[activeX]) return;
    if (hasNextPage && activeX >= items.length - 4 && !isFetchingNextPage) {
      void fetchNextPage();
    }
    // Prefetch next item into query cache for instant card render.
    const nextItem = items[activeX + 1];
    if (nextItem) {
      void queryClient.prefetchQuery({
        queryKey: ["feed", "video", nextItem.id],
        queryFn: () => Promise.resolve(nextItem),
        staleTime: Infinity,
      });
    }
  }, [activeX, fetchNextPage, hasNextPage, isActiveCluster, isFetchingNextPage, items, queryClient]);

  return (
    <section className="relative h-full w-full bg-black" aria-label={cluster.title}>
      <div ref={virtualRef} className="sr-only" aria-hidden="true">
        {virtualItems.length} virtual item slots prepared
      </div>

      {isLoading ? (
        <div className="flex h-full items-center justify-center text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Swiper
          modules={[A11y]}
          className="horizontal-feed-swiper h-full w-full bg-white"
          direction="horizontal"
          nested
          loop
          allowTouchMove
          resistanceRatio={0.72}
          threshold={6}
          touchAngle={35}
          touchStartPreventDefault={false}
          passiveListeners={false}
          slidesPerView={scaleLevel.slidesPerView}
          spaceBetween={2}
          centeredSlides
          centeredSlidesBounds={false}
          initialSlide={activeX}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            if (isActiveCluster) onSwiperReady?.(swiper);
          }}
          onSlideChange={(swiper) => {
            // loop mode: use realIndex (0…n-1), not activeIndex (includes clones)
            const item = items[swiper.realIndex];
            if (item) onItemChange(swiper.realIndex, item.id);
          }}
        >
          {items.map((item, x) => (
            <SwiperSlide key={item.id} className="h-full w-full">
              <motion.div 
                layout
                initial={false}
                className="h-full w-full will-change-transform transform-gpu"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                  mass: 0.8
                }}
              >
                <FeedVideoCard
                  item={item}
                  active={!isPaused && isActiveCluster && activeX === x}
                  preload={!isPaused && isActiveCluster && Math.abs(activeX - x) === 1}
                  compact={scaleLevel.slidesPerView >= 3}
                />
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div className="hidden">
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
