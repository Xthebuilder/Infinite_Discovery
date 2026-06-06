# Infinite Discovery

Team repository for the Infinite Discovery demo.

The deployable app is in:

```text
Enders_first_demo/
```

## Local Run

```bash
cd Enders_first_demo
npm install
npm run dev
```

Open:

```text
http://localhost:3000/feed
```

## Vercel

When importing this repository into Vercel, set:

- Root Directory: `Enders_first_demo`
- Framework Preset: `Next.js`
- Install Command: default is fine because `.npmrc` enables `legacy-peer-deps`
- Build Command: `npm run build`
- Output Directory: leave empty/default

The app uses mock/generated feed data for now, so no database or environment variables are required for the demo deploy.
