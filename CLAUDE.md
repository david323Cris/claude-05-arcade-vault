# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score. Developed spec-driven (`/spec` and `/spec-impl` workflow, skills from `Klerith/fernando-skills`, installed via `npx skills@latest add Klerith/fernando-skills`). The codebase is currently the untouched `create-next-app` scaffold (`app/page.tsx` is the default template; layout metadata is still "Create Next App").

## Commands

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint (flat config: eslint.config.mjs)
```

No test runner is configured. Not a git repository yet.

## Next.js version warning

Next 16.4.6 / React 19.3 — has breaking changes vs. what you may know (see `AGENTS.md`). Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Architecture notes

- App Router only (`app/`); no `src/` dir. Path alias `@/*` maps to the repo root.
- `next.config.ts` enables non-default features that affect how pages must be written: `cacheComponents: true`, `partialPrefetching: true`, `experimental.agentFeedback`. Check the docs for how these change data fetching/caching semantics before adding routes.
- Tailwind v4 runs through Turbopack via a custom rule in `next.config.ts` (`*.css` → `@tailwindcss/turbopack`), not PostCSS. Styles live in `app/globals.css`.
- `app/layout.tsx` uses the globally-typed `LayoutProps<"/">` helper (no import needed) and Geist fonts via `next/font/google`.
- TypeScript is `strict`.
