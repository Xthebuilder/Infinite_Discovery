import { Suspense } from "react";

import { TwoDimensionalFeed } from "@/components/feed/two-dimensional-feed";

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-dvh items-center justify-center bg-black text-white">
          Loading feed
        </main>
      }
    >
      <TwoDimensionalFeed />
    </Suspense>
  );
}
