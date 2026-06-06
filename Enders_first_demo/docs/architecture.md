# Architecture

## Feed Model

The product is graph-first:

```text
cluster y-axis -> related items x-axis
```

The active coordinate is:

```ts
{
  x: number;
  y: number;
  clusterId: string;
  itemId: string;
}
```

## Current Runtime

- Next.js App Router owns routes and API handlers.
- TanStack Query owns server state, caching, infinite loading, and prefetching.
- Zustand owns local navigation state.
- Swiper owns gesture navigation.
- Vidstack owns media playback.
- Zod validates API responses.
- MSW provides a local mock backend in development.

## Expansion Path

1. Keep `src/lib/feed/schema.ts` as the shared API contract.
2. Move ranking logic into `src/features/recommendation`.
3. Move database-only code into `src/server/db`.
4. Keep feature UI under `src/features/<feature>/components` once it grows beyond shared feed UI.
