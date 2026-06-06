# Database

No production database is wired yet.

Recommended hackathon path:

1. Keep mock APIs until the demo story is stable.
2. Add Supabase or PostgreSQL only if real persistence becomes necessary.
3. Model the feed as a graph:

```text
clusters
feed_items
creators
cluster_items
user_events
```

Do not flatten the feed into one global list.
