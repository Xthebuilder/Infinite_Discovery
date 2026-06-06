# Infinite Discovery

A production-grade MVP for a TikTok-like two-dimensional discovery feed.

- Vertical swipe changes clusters, topics, or creators.
- Horizontal swipe consumes related content inside the active cluster.
- Current location is represented as `{ x, y, clusterId, itemId }`.
- Deep links restore `/feed?cluster=xxx&item=yyy`.

## Stack

Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, Swiper, Zustand, TanStack Query, TanStack Virtual, Vidstack, react-intersection-observer, MSW, Zod, and PostHog.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/feed`.

## Project Structure

- `src/components/feed`: 2D Swiper feed, cluster slides, Vidstack video cards.
- `src/lib/feed`: Zod schemas, generated graph data, fetchers, Query options, Zustand store.
- `src/mocks`: MSW handlers and browser worker setup.
- `src/app/api/feed`: mock-compatible Next.js route handlers.
- `src/lib/analytics`: PostHog-backed analytics abstraction.
- `docs/research.md`: GitHub research and library selection rationale.

## Database

There is no real database yet. The MVP uses generated mock graph data plus Next.js route handlers and MSW. The production path is PostgreSQL or Supabase with tables for clusters, feed items, creators, and ranked graph edges.

## Vercel Deployment

This demo is ready for Vercel.

If deploying the whole `Infinite_Discovery` repository, set the Vercel Root Directory to:

```text
Enders_first_demo
```

Vercel settings:

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: default/empty

No database or required environment variables are needed for the current demo. The API is backed by generated mock data in `src/lib/feed/mock-data.ts`.
