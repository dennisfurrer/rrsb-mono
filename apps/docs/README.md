# @rrsb/docs

Bilingual documentation site for the RRSB monorepo. Covers the full system — from operational guides for running club matches to technical architecture for developers.

## Audience

Two primary readers:

- **Dennis** — primary developer, English-speaking, writes and maintains all code
- **Markus** — club manager and hobby programmer (PHP/WordPress background, not JS-familiar), German-speaking, operates the club systems day-to-day

Every page exists in both **German** and **English**. Authors write in English; German translations are AI-generated and reviewed by Markus.

## What the docs cover

- **Getting started** — how to set up the monorepo, run each app locally, and deploy
- **System architecture** — how the apps and packages fit together, data flow from scoreboard through API to database to statistics
- **App guides** — per-app documentation for scoreboard-ui, scores-and-stats-api, statistics-ui, and the shared db package
- **Operational guides** — how to run a match on the scoreboard, how stats get recorded, how to manage players, how the highlights system works
- **Contributing** — how to make changes, the monorepo workflow, PR process

## Tech stack

**[Starlight](https://starlight.astro.build/)** (Astro's documentation framework)

Chosen because:

- **First-class i18n** — built-in multilingual routing (`/en/...`, `/de/...`), language switcher, and fallback when a translation is missing
- **Markdown authoring** — content lives as `.md` files that anyone can edit without framework knowledge
- **Built-in search** — Pagefind, works offline, supports German
- **Static output** — builds to plain HTML, deployable to Vercel, Netlify, or GitHub Pages
- **Minimal overhead** — no SSR, no runtime JS beyond search. Pure docs

## Translation workflow

```
src/content/docs/en/guide/getting-started.md   (author writes in English)
        |
        v  AI translation (Claude)
        |
src/content/docs/de/guide/getting-started.md   (Markus reviews German)
```

## Project structure (planned)

```
apps/docs/
├── astro.config.mjs
├── package.json
├── src/
│   ├── content/
│   │   └── docs/
│   │       ├── en/
│   │       │   ├── index.mdx
│   │       │   ├── getting-started/
│   │       │   ├── architecture/
│   │       │   ├── apps/
│   │       │   ├── operations/
│   │       │   └── contributing/
│   │       └── de/
│   │           └── (mirrors en/ structure)
│   └── assets/
│       └── (diagrams, screenshots)
└── public/
    └── (static assets)
```
