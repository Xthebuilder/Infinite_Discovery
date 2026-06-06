# Feature Modules

Use this directory for product areas that will grow beyond one component.

Suggested convention:

```text
features/<feature>/
  components/
  hooks/
  mutations/
  queries/
  schema.ts
  types.ts
  README.md
```

Keep route files in `src/app`, but move feature-specific logic into this directory once it grows.
