# Two-Day Hackathon Plan

## Goal

Deliver a clear, deployable demo of a two-dimensional discovery feed.

## Day 1

- Stabilize feed navigation and deep links.
- Improve visual polish around active cluster and active item.
- Add a small explanation layer for why the next cluster/item is recommended.
- Keep mock backend and avoid database work unless persistence is required.

## Day 2

- Add one memorable interaction: save, like, or creator detail drawer.
- Add analytics events through `AnalyticsProvider`.
- Add a short README section with demo script and Vercel link.
- Run `npm run lint` and `npm run build` before final push.

## Do Not Do

- Do not replace the feed graph with a flat list.
- Do not add Redux.
- Do not add a real database unless the demo story needs it.
- Do not create direct PostHog calls in UI components.
- Do not build custom swipe or video engines when Swiper and Vidstack cover the need.
