# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev

- **Package manager**: pnpm (not npm/yarn)
- **Node**: >= 22.12.0 required (`engines` in package.json)
- `pnpm dev` — start dev server at localhost:4321
- `pnpm build` — production build to `./dist/`
- `./publish.sh` — one-click publish: auto-generates commit message from changed posts, pushes to master

## Content Pipeline

- Posts in `src/content/posts/` are **synced from Obsidian via S3** (GitHub Actions, every 5 min). Avoid manual edits to synced posts — they will be overwritten.
- Post frontmatter schema: see `src/content.config.ts` for types (`article | til | weekly`), required fields (`title`, `description`, `date`, `type`, `tags`, `toc`, `draft`), and optional fields (`updated`, `weekNumber`, `ogImage`, `canonicalUrl`).
- Data files (`src/data/site.ts`, `projects.ts`, `now.ts`) are manually maintained.

## Code Conventions

- Language: zh-CN — all user-facing text is Chinese
- Direct push to master, no PR workflow
- Strict TypeScript (`astro/tsconfigs/strict`)
- Styling: Tailwind CSS 4 with CSS variables in `src/styles/global.css` — Rosé Pine theme (Dawn light + dark mode via `html.dark` class)
- Interactive components use React (via `@astrojs/react`), mounted with `client:load`
- Biome for linting + formatting (2-space indent, single quotes). Auto-runs on every edit via hook.
