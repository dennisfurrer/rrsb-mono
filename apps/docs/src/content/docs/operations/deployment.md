---
title: Deployment
description: How the apps are deployed and hosted.
---

:::note
Deployment is not yet configured. This page will be updated as we set up CI/CD and hosting.
:::

## Current state

All apps are run locally in development mode. There is no production deployment pipeline yet.

## Planned setup

| App | Deployment target | Notes |
|---|---|---|
| **Scoreboard UI** | Static file upload | Builds to a single HTML file — can be served from anywhere |
| **Statistics UI** | Static hosting (Vercel/Netlify) | SPA with client-side routing |
| **API Server** | VPS or cloud (TBD) | Needs a running Node.js process and database access |
| **Docs** | Static hosting (Vercel/Netlify/GitHub Pages) | Built with Astro, outputs static HTML |
| **Database** | PostgreSQL on VPS | Same server as the API, or managed service |

## Building for production

```bash
# Build all apps
pnpm build

# Build a specific app
pnpm --filter @rrsb/scoreboard-ui build
```

The scoreboard UI build output is in `apps/scoreboard-ui/dist/` — a single `index.html` file with inlined CSS and JS.
