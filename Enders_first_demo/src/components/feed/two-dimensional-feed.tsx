/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type WheelEvent,
} from "react";
import { A11y, Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/virtual";

import { motion, LayoutGroup } from "framer-motion";
import { ClusterSlide } from "@/components/feed/cluster-slide";
import { DeepDiveGrid } from "./deep-dive-grid";
import { getRelatedItems } from "@/lib/feed/utils";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useAnalytics } from "@/lib/analytics/analytics";
import { clusterListQuery, prefetchNeighborhood } from "@/lib/feed/queries";
import { useFeedNavigationStore } from "@/lib/feed/store";

const SCALE_LEVELS = [
  { id: "scale-2", label: "Scale 2", percent: "100%", slidesPerView: 1 },
  {
    id: "scale-1",
    label: "Scale 1",
    percent: "85%",
    slidesPerView: 1 / 0.85,
  },
  {
    id: "scale-0-5",
    label: "Scale 0.5",
    percent: "33.333%",
    slidesPerView: 3,
  },
  {
    id: "scale-0-25",
    label: "Scale 0.25",
    percent: "20%",
    slidesPerView: 5,
  },
] as const;

export type FeedScaleLevel = (typeof SCALE_LEVELS)[number];

type PinchTouchList = {
  item: (index: number) => { clientX: number; clientY: number } | null;
};

function distanceBetweenTouches(touches: PinchTouchList) {
  const first = touches.item(0);
  const second = touches.item(1);

  if (!first || !second) {
    return 0;
  }

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

export function TwoDimensionalFeed() {
  useLockBodyScroll();

  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { track } = useAnalytics();
  const verticalSwiperRef = useRef<SwiperInstance | null>(null);
  const horizontalSwiperRef = useRef<SwiperInstance | null>(null);
  const virtualRef = useRef<HTMLDivElement | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchChangedThisGestureRef = useRef(false);
  const pinchLockedUntilTouchResetRef = useRef(false);
  const lastScaleStepAtRef = useRef(0);
  const lastWheelNavigationRef = useRef(0);
  const hydratedFromInitialUrlRef = useRef(false);
  const [activeY, setActiveY] = useState(5);
  const [activeX, setActiveX] = useState(5);
  const [scaleIndex, setScaleIndex] = useState(0);
  const scaleLevel = SCALE_LEVELS[scaleIndex];
  
  const isDeepDive = useFeedNavigationStore((s) => s.isDeepDive);
  const deepDiveAnchorItem = useFeedNavigationStore((s) => s.deepDiveAnchorItem);
  const setDeepDive = useFeedNavigationStore((s) => s.setDeepDive);
  const setLocation = useFeedNavigationStore((state) => state.setLocation);
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
    overscan: 12,
  });

  useEffect(() => {
    if (
      hydratedFromInitialUrlRef.current ||
      !requestedClusterId ||
      !clusters.length
    ) {
      return;
    }

    const requestedY = clusters.findIndex(
      (cluster) => cluster.id === requestedClusterId,
    );

    if (requestedY >= 0) {
      setActiveY(requestedY);
      verticalSwiperRef.current?.slideTo(requestedY, 0);
      hydratedFromInitialUrlRef.current = true;
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

  useEffect(() => {
    const swiper = verticalSwiperRef.current;

    if (!swiper) {
      return;
    }

    swiper.update();

    if (swiper.activeIndex !== activeY) {
      swiper.slideTo(activeY, 0);
    }
  }, [activeY, scaleLevel.slidesPerView]);

  const commitLocation = useCallback(
    (x: number, y: number, itemId: string) => {
      const cluster = clusters[y];

      if (!cluster) {
        return;
      }

      setActiveX(x);
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

      // Keep gestures isolated from routing. Updating the URL on every slide can
      // feed back into Swiper while the user is still dragging.
    },
    [clusters, setLocation, track],
  );

  const stepScale = useCallback((direction: "in" | "out") => {
    if (direction === "out") {
      if (isDeepDive) {
        setDeepDive(false);
        setScaleIndex(0);
        return;
      }
      setScaleIndex((current) => Math.min(current + 1, SCALE_LEVELS.length - 1));
    } else {
      // direction === "in"
      if (scaleIndex === 0) {
        console.log(
          "%c 🚀 SYSTEM: TRIGGERING DEEP DIVE (3x3 RELATED GRID) ",
          "background: #1d4ed8; color: white; font-weight: bold; font-size: 14px; padding: 6px 12px; border-radius: 8px;"
        );
        const activeClusterId = clusters[activeY]?.id;
        if (activeClusterId) {
          const itemsData: any = queryClient.getQueryData(["feed", "cluster", activeClusterId, "items"]);
          // Flatten all pages to find the item by global index
          const allItems = itemsData?.pages?.flatMap((p: any) => p.items) || [];
          const currentItem = allItems[activeX];

          if (currentItem) {
            setDeepDive(true, currentItem);
          } else {
            console.error("❌ System: Item not found at index", activeX, "in", allItems.length, "items");
          }
        }
      } else {
        setScaleIndex((current) => Math.max(current - 1, 0));
      }
    }
  }, [clusters, activeY, activeX, isDeepDive, scaleIndex, setDeepDive, queryClient]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    if (event.touches.length === 2 && !pinchLockedUntilTouchResetRef.current) {
      pinchStartDistanceRef.current = distanceBetweenTouches(event.touches);
      pinchChangedThisGestureRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (
        event.touches.length !== 2 ||
        !pinchStartDistanceRef.current ||
        pinchLockedUntilTouchResetRef.current
      ) {
        return;
      }

      event.preventDefault();

      if (pinchChangedThisGestureRef.current) {
        return;
      }

      const distance = distanceBetweenTouches(event.touches);
      const ratio = distance / pinchStartDistanceRef.current;
      const now = performance.now();

      if (now - lastScaleStepAtRef.current < 900) {
        return;
      }

      if (ratio < 0.68) {
        stepScale("out");
        pinchChangedThisGestureRef.current = true;
        pinchLockedUntilTouchResetRef.current = true;
        lastScaleStepAtRef.current = now;
      }

      if (ratio > 1.32) {
        stepScale("in");
        pinchChangedThisGestureRef.current = true;
        pinchLockedUntilTouchResetRef.current = true;
        lastScaleStepAtRef.current = now;
      }
    },
    [stepScale],
  );

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => {
    if (event.touches.length === 0) {
      pinchStartDistanceRef.current = null;
      pinchChangedThisGestureRef.current = false;
      pinchLockedUntilTouchResetRef.current = false;
      return;
    }

    if (event.touches.length < 2) {
      pinchStartDistanceRef.current = null;
      pinchChangedThisGestureRef.current = false;
    }
  }, []);

  const navigateByAxis = useCallback((axis: "x" | "y", direction: 1 | -1) => {
    const swiper = axis === "x" ? horizontalSwiperRef.current : verticalSwiperRef.current;

    if (!swiper || swiper.animating) {
      return;
    }

    if (direction > 0) {
      swiper.slideNext();
    } else {
      swiper.slidePrev();
    }
  }, []);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const now = performance.now();
        if (now - lastScaleStepAtRef.current < 900) {
          return;
        }

        lastScaleStepAtRef.current = now;
        stepScale(event.deltaY > 0 ? "out" : "in");
        return;
      }

      event.preventDefault();

      const now = performance.now();
      if (now - lastWheelNavigationRef.current < 260) {
        return;
      }

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);

      if (Math.max(absX, absY) < 18) {
        return;
      }

      lastWheelNavigationRef.current = now;

      if (absX > absY) {
        navigateByAxis("x", event.deltaX > 0 ? 1 : -1);
        return;
      }

      navigateByAxis("y", event.deltaY > 0 ? 1 : -1);
    },
    [navigateByAxis, stepScale],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateByAxis("x", 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateByAxis("x", -1);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        navigateByAxis("y", 1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        navigateByAxis("y", -1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigateByAxis]);

  if (isLoading) {
    return (
      <main className="flex h-dvh items-center justify-center bg-black text-white">
        <Loader2 className="h-7 w-7 animate-spin" />
      </main>
    );
  }

  return (
    <main
      className="feed-shell relative h-dvh w-full overflow-hidden bg-black text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <LayoutGroup>
      <div ref={virtualRef} className="sr-only" aria-hidden="true">
        {clusterVirtualizer.getVirtualItems().length} virtual cluster slots prepared
      </div>

      <motion.div 
        className="h-full w-full"
        initial={false}
        animate={{
          scale: 1,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 450, 
          damping: 40,
          mass: 0.8
        }}
      >
        <Swiper
          modules={[A11y, Virtual]}
          className="vertical-feed-swiper h-full w-full bg-white"
          direction="vertical"
          virtual
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
                x: activeX,
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
                activeX={activeX}
                scaleLevel={scaleLevel}
                isPaused={isDeepDive}
                requestedItemId={
                  cluster.id === requestedClusterId ? requestedItemId : undefined
                }
                onItemChange={(x, itemId) => commitLocation(x, y, itemId)}
                onSwiperReady={(swiper) => {
                  horizontalSwiperRef.current = swiper;
                }}
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
      </motion.div>
      <div className="absolute bottom-[max(6rem,env(safe-area-inset-bottom)+5rem))] left-4 z-30 flex flex-col items-center gap-2">
        <div className="pointer-events-none hidden rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white/82 backdrop-blur">
          {scaleLevel.percent} - {scaleLevel.label}
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => stepScale("in")}
            disabled={isDeepDive && scaleIndex === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/80 text-xl font-bold text-white shadow-lg backdrop-blur-md transition-all active:scale-95 disabled:opacity-30"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => stepScale("out")}
            disabled={!isDeepDive && scaleIndex === SCALE_LEVELS.length - 1}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-xl font-bold text-white shadow-lg backdrop-blur-md transition-all active:scale-95 disabled:opacity-30"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>
      {isDeepDive && deepDiveAnchorItem && (
        <DeepDiveGrid 
          anchorItem={deepDiveAnchorItem}
          relatedItems={(() => {
            const allItems = clusters.flatMap(c => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data: any = queryClient.getQueryData(["feed", "cluster", c.id, "items"]);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return data?.pages?.flatMap((p: any) => p.items) || [];
            });
            const related = getRelatedItems(deepDiveAnchorItem.id, allItems);
            console.log("🔍 Debug DeepDive:", {
              anchorId: deepDiveAnchorItem.id,
              totalAvailable: allItems.length,
              foundRelated: related.length,
              relatedIds: related.map(r => r.id)
            });
            return related;
          })()}
          onClose={() => setDeepDive(false)}
        />
      )}
      </LayoutGroup>
    </main>
  );
}
