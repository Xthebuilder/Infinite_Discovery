"use client";

import { MediaOutlet, MediaPlayer, MediaPoster } from "@vidstack/react";
import { Heart, MessageCircle, Send, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useInView } from "react-intersection-observer";

import { Button } from "@/components/ui/button";
import type { FeedItem } from "@/lib/feed/schema";
import { cn } from "@/lib/utils";

type FeedVideoCardProps = {
  item: FeedItem;
  active: boolean;
  preload?: boolean;
  compact?: boolean;
};

export function FeedVideoCard({
  item,
  active,
  preload,
  compact = false,
}: FeedVideoCardProps) {
  const playerRef = useRef<HTMLElement | null>(null);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.72,
    rootMargin: "12% 0px",
  });
  const shouldPlay = active && inView;

  useEffect(() => {
    const player = playerRef.current as (HTMLElement & {
      play?: () => Promise<void>;
      pause?: () => void;
    }) | null;

    if (!player) {
      return;
    }

    if (shouldPlay) {
      void player.play?.()?.catch(() => undefined);
    } else {
      player.pause?.();
    }
  }, [shouldPlay, item.id]);

  useEffect(() => {
    if (!preload) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = item.videoUrl;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [item.videoUrl, preload]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [],
  );

  return (
    <article ref={inViewRef} className="relative h-full w-full overflow-hidden bg-black">
      <MediaPlayer
        ref={playerRef}
        src={item.videoUrl}
        autoplay={shouldPlay}
        muted
        loop
        playsinline
        className="pointer-events-none absolute inset-0 h-full w-full bg-black [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      >
        <MediaOutlet>
          <MediaPoster
            src={item.posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </MediaOutlet>
      </MediaPlayer>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 via-black/32 to-transparent",
          compact ? "h-1/2" : "h-2/5",
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between text-white",
          compact
            ? "gap-2 p-2"
            : "gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6",
        )}
      >
        <div
          className={cn(
            "min-w-0 text-white",
            compact ? "max-w-full space-y-1" : "max-w-[78%] space-y-2",
          )}
        >
          <p className={cn("font-semibold", compact ? "text-[10px]" : "text-sm")}>
            {item.creatorName}
          </p>
          <h2
            className={cn(
              "font-semibold leading-tight",
              compact ? "line-clamp-2 text-xs" : "text-2xl",
            )}
          >
            {item.title}
          </h2>
          <p
            className={cn(
              "line-clamp-2 leading-5 text-white/82",
              compact ? "hidden" : "text-sm",
            )}
          >
            {item.description}
          </p>
        </div>

        <div
          className={cn(
            "shrink-0 flex-col items-center text-white",
            compact ? "hidden" : "flex gap-3",
          )}
        >
          <MetricButton
            icon={<Heart className="h-5 w-5" />}
            label={formatter.format(item.stats.likes)}
          />
          <MetricButton
            icon={<MessageCircle className="h-5 w-5" />}
            label={formatter.format(item.stats.comments)}
          />
          <MetricButton
            icon={<Send className="h-5 w-5" />}
            label={formatter.format(item.stats.shares)}
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn("pointer-events-auto rounded-full", shouldPlay && "bg-white/20")}
            aria-label="Muted autoplay is active"
          >
            <Volume2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function MetricButton({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <button className="pointer-events-auto flex min-w-12 flex-col items-center gap-1 text-xs font-semibold text-white">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
