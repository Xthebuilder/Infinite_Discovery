# Server

Future backend-only code lives here. Files in this directory should not be imported by client components.

Suggested areas:

- `db`: database clients, migrations notes, repository functions.
- `services`: backend business logic for ranking, creators, and graph APIs.
- `jobs`: background tasks such as feed refresh, ranking recomputation, and analytics rollups.

Current MVP uses Next.js route handlers and generated mock data instead of a real database.
