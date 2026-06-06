# Source Layout

This app is intentionally organized around product surfaces and shared platform code.

- `app`: Next.js routes, layouts, route handlers, and page entry points.
- `components`: reusable UI and composition components.
- `features`: future domain modules. Each feature should own its UI, hooks, mutations, and feature-specific types.
- `lib`: cross-cutting utilities, API clients, analytics, validation, and shared integrations.
- `server`: future backend-only code such as database access, services, and jobs.
- `config`: app-wide configuration that is safe to import.
- `constants`: stable product constants.
- `types`: shared TypeScript types that do not belong to a single feature.
- `mocks`: MSW handlers and mock runtime setup.

Rule of thumb: if a file is only useful for one feature, put it under `features/<feature>`. If it is reused across the app, put it under `components`, `lib`, `server`, `config`, `constants`, or `types`.
