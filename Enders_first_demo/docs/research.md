# Open Source Research

Date: 2026-06-06

## GitHub Findings

- `SashenJayathilaka/TIK-TOK-Clone`: useful Next.js + Tailwind reference for a classic TikTok clone, but it is Firebase-based, JavaScript-heavy, and models content as a flat feed.
- `John-Weeks-Dev/tiktok-clone-nextjs`: useful full-stack Next.js/AppWrite clone with TypeScript and profile/post concepts, but it targets Next 13 and a one-dimensional post stream.
- `reinaldosimoes/react-vertical-feed`: focused React vertical video feed component with Intersection Observer-based play/pause. Good validation of autoplay/visibility patterns, but it does not support horizontal-in-cluster navigation or graph data.
- Searches for nested swiper, infinite video feed, short video app, and react reels found several examples, but no mature two-dimensional `(x,y)` graph feed implementation suitable for direct reuse.

## Chosen Libraries

- Next.js 15 + React 19: requested stack, App Router, route handlers for typed mock APIs.
- TailwindCSS + shadcn/ui: requested UI stack; shadcn provides composable primitives while keeping the feed full-screen.
- Swiper.js: vertical parent swiper plus horizontal nested swipers; chosen over Embla and react-use-gesture because it already handles mobile momentum, nested swipes, keyboard support, and virtual slides.
- Zustand: small client navigation store for current `{ x, y, clusterId, itemId }`; no Redux.
- TanStack Query: server-state cache, infinite queries, prefetching, and query invalidation surface.
- TanStack Virtual: virtualization bookkeeping for cluster/item windows; Swiper Virtual performs the actual slide DOM windowing.
- Vidstack: headless media player with mobile-friendly APIs; only the active card is asked to play.
- react-intersection-observer: viewport detection for video play/pause without hand-written IntersectionObserver plumbing.
- MSW: development mock backend with realistic latency and paginated APIs; route handlers provide the same shape outside the worker.
- Zod: runtime response validation for all fetchers.
- PostHog: analytics backend behind `AnalyticsProvider`; UI never imports PostHog directly.

## Architecture Notes

The feed is a graph, not a flat list:

```ts
type FeedGraph = {
  clusters: Cluster[];
};

type Cluster = {
  id: string;
  title: string;
  score: number;
  items?: FeedItem[];
};

type FeedItem = {
  id: string;
  title: string;
  videoUrl: string;
  creatorId: string;
};
```

Cluster metadata is loaded vertically with an infinite query. Each rendered cluster owns an infinite query for its horizontal items. Navigation writes to Zustand and to `/feed?cluster=xxx&item=yyy`.

## Scaling Plan

- Keep clusters as metadata pages and load item pages only for the active neighborhood.
- Keep Swiper Virtual enabled for vertical and horizontal axes.
- Prefetch the next vertical cluster and next horizontal item from TanStack Query.
- Move mock route handlers to real APIs without changing UI contracts because fetchers are Zod-validated.
- Add analytics batching and exposure-duration events in the analytics abstraction, not in UI components.
- For very large item counts, replace generated mock data with cursor-backed IDs and server-side ranking windows.
