"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { FeedVideoCard } from "./feed-video-card";
import type { FeedItem } from "@/lib/feed/schema";
import { Button } from "@/components/ui/button";

type DeepDiveGridProps = {
  anchorItem: FeedItem;
  relatedItems: FeedItem[];
  onClose: () => void;
};

export function DeepDiveGrid({ anchorItem, relatedItems, onClose }: DeepDiveGridProps) {
  // Fill exactly 9 positions to ensure the anchor is always at [1,1] (index 4)
  const displayItems: (FeedItem | null)[] = new Array(9).fill(null);
  
  // Place anchor at center
  displayItems[4] = anchorItem;

  // Fill surrounding slots
  let relatedIdx = 0;
  for (let i = 0; i < 9; i++) {
    if (i === 4) continue;
    if (relatedItems[relatedIdx]) {
      displayItems[i] = relatedItems[relatedIdx];
      relatedIdx++;
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2
      }
    }
  };

  const itemAnim = {
    hidden: { scale: 0.3, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-2xl"
    >
      {/* 3x3 Grid Layout */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid flex-1 grid-cols-3 grid-rows-3 gap-1 p-1 sm:gap-3 sm:p-3"
      >
        {displayItems.map((item, index) => {
          if (!item) return <div key={`empty-${index}`} className="bg-white/5 rounded-sm" />;
          
          const isAnchor = item.id === anchorItem.id;
          
          return (
            <motion.div
              key={item.id}
              layoutId={isAnchor ? `video-${item.id}` : undefined}
              variants={!isAnchor ? itemAnim : undefined}
              className="relative h-full w-full overflow-hidden rounded-md shadow-2xl border border-white/5 bg-black"
            >
              <FeedVideoCard 
                item={item} 
                active={isAnchor} // ONLY auto-play the center one to be safe
                compact={true} 
              />
              {isAnchor && (
                <div className="absolute inset-0 border-4 border-blue-500/60 pointer-events-none z-30 rounded-md" />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Header / Info */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-[110] pointer-events-none">
        <div className="bg-blue-600/90 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl backdrop-blur-md">
          SIMILAR CONTENT MATRIX
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="pointer-events-auto h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute bottom-10 inset-x-0 flex justify-center z-[110] pointer-events-none">
        <p className="text-white/50 text-xs font-medium tracking-widest uppercase">
          Zoom out or click X to return
        </p>
      </div>
    </motion.div>
  );
}
