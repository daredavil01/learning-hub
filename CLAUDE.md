# CLAUDE.md

Learning Hub: a public, forkable tracker for the AI Architect 60-day plan, served at learn.sankettambare.in. The app name comes from `meta.name` in `data/roadmap.yaml`.

- Source plan: `AI Architect 60-Day Plan — Consolidated.md`
- Implementation plan and future features: `docs/plan.md`
- Design reference (Claude Design export, not shipped): `design-files/AI Architect Hub.dc.html`. `support.js` there is the Claude Design runtime, not app code.

## Stack

- Astro 7 static site with one React 19 island: `src/pages/index.astro` → `src/components/App.tsx`. One file per screen in `src/components/screens/`, overlays in `src/components/Dialogs.tsx`, shared bits in `src/components/ui.tsx`.
- Content: `data/roadmap.yaml`, validated by Zod in `src/lib/roadmap.ts` at build time. A bad entry fails `npm test` and `npm run build`.
- Plan logic (phases, dates, daily task blocks, optional race): `src/lib/plan.ts`, tested in `src/lib/plan.test.ts` with `node --test`.
- Per-user progress: `src/lib/store.ts`. Supabase (email + password auth) when signed in, `localStorage` in demo mode. Both use a flat map `kind:item_id → JSON value`. Table and RLS: `supabase/migrations/`. RLS check: `supabase/tests/rls_check.sql`.
- Logo: `public/logo.svg` (mark + wordmark), `public/favicon.svg` and `LogoMark` in `ui.tsx` share one drawing; change all three together. The wordmark text in `logo.svg` is outlined to paths (Caprasimo + Figtree SemiBold via opentype.js), so re-outline it to change the words.
- Styling: `src/styles/organic.css` (design system tokens; retune there) + `src/styles/hub.css` (app classes). Layout breakpoints are CSS media queries.
- Routing: hash routes (`#/plan`). Pages and their groups: `NAV_GROUPS` in `App.tsx`; the header shows only `NAV_TOP`. Hosting: Cloudflare git integration, static `dist/`. CI: `.github/workflows/ci.yml` (test + build), `links.yml` (lychee).

## Commands

```bash
npm install
npm run dev      # http://localhost:4321
npm test         # plan logic + roadmap.yaml schema
npm run build
```

Env vars (optional; without them only demo mode is offered): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`. See `.env.example`. Only the publishable key belongs there.

## Conventions

- `data/roadmap.yaml` is the only source of plan content. Screens read it; never hard-code plan data in components.
- `id`s in `roadmap.yaml` never change once published: saved progress references them without a foreign key. Task ids are `d{day}-{index}` from `plan.ts`.
- Personal progress never goes in git.
- New kinds of progress: add the kind to the `Kind` type in `store.ts` **and** to the check constraint in a new migration.
- Every Supabase table gets RLS with `auth.uid() = user_id`; extend `rls_check.sql` for it.
- Writes are optimistic and revert on failure (notes do not revert; the text stays in the box). Hours and spend are append-only entries.
- Never copy content from non-commercially licensed repos (`license: link-only`). Link only.
- Code is MIT, notes are CC BY 4.0.

## Docs to keep current

With every change:

1. Add an entry to `docs/changelog.md` under `[Unreleased]`.
2. Add anything surprising or costly to `docs/lessons.md` (date, what happened, what to do next time).
3. Update `docs/plan.md` when scope or decisions change.
