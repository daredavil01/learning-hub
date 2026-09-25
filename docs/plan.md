# Plan: Learning Hub v0

## Context

This repository becomes Learning Hub, the public, forkable tracker for the AI Architect 60-day plan (`AI Architect 60-Day Plan — Consolidated.md`), served at learn.sankettambare.in. The UI implements the Claude Design file `design-files/AI Architect Hub.dc.html`. The plan's checkpoint is "hub live by day 7" (4 October 2026).

The design is a 12-screen interactive app, not a docs site. About and Created by screens were added on top of the design. Navigation: four pages in the header (Today, Dashboard, Plan, Resources); every page, in five groups, in the footer and the menu panel.

| Screen | What it does |
| --- | --- |
| Today | Day N of 60, generated task blocks (learn/build/interview/capture), focus timer, daily capture, log time, next checkpoint. Rest (day 55) and race (day 56) screens. |
| Dashboard | KPIs, 60-day grid, hours by track, core project progress |
| Plan | Weeks list, selected week's learn/build/interview, days, checkpoint, resources |
| Resources | Search, filters (week/type/priority), table or card view, done toggles |
| Projects | 4 core projects with deliverable checklists, README template, existing projects, idea verdicts |
| Interview | 12 flashcards with outlines and again/good/easy ratings, DSA counters, 4 mocks |
| Daily log | One note per day |
| STAR stories | 8 story slots, 2 samples, editor dialog |
| Checkpoints | Timeline with done/due/overdue |
| Budget | Spend log against a $20 cap, cost table |
| Ecosystem | 2026 changes |
| Ask my learnings | "Coming soon" notice; demo chat with canned answers until the real version ships |
| Created by | Sanket Tambare: bio and links (content from `author` in `roadmap.yaml`) |
| About | What the plan is, the three tracks, daily rhythm, where progress is saved, how to fork (content from `about` in `roadmap.yaml`) |

## Decisions

- **Stack: Astro 7 + one React 19 island.** Starlight was dropped: the design has no docs pages. Add Starlight back when Markdown notes exist.
- **Curriculum data: `data/roadmap.yaml`**, parsed and validated with Zod at build time (`src/lib/roadmap.ts`). A bad entry fails the build. Weeks, resources, projects, checkpoints, flashcards, DSA topics, mocks, costs and ecosystem entries all live there so a fork edits one file.
- **Per-user data: Supabase** (new free project), **email + password** sign-in and password reset. No email confirmation: sign-up signs the user in immediately (Supabase "Confirm email" off). (GitHub OAuth was the first choice; it was dropped for email + password and can come back as a second provider.) One generic table, `progress(user_id, kind, item_id, value jsonb)`, with RLS `auth.uid() = user_id`. Each checkbox, note, story, spend entry or hours entry is its own row, so two devices do not overwrite each other's work. Hours and spend are append-only entries.
- **Demo mode:** "Continue as demo" stores the same rows in `localStorage`. A fork with no Supabase env vars still gets a working tracker.
- **Current day:** computed from the user's start date (default `2026-09-28` from `roadmap.yaml`). Settings dialog: change the start date, "Start today" to reset, and a switch to skip the race. With the race skipped, week 8 runs days 50–56 and there are no rest/race screens.
- **Theme and view preferences** (dark mode, table/cards) stay in `localStorage` per device.
- **Routing:** hash routes (`#/resources`) so the static build needs no server fallback.
- **Styling:** the Organic design system stylesheet (`src/styles/organic.css`) plus app classes in `src/styles/hub.css` that replace the design's inline styles. Layout switches use CSS media queries, not JS width checks.

## Steps

1. Repo docs: `docs/plan.md`, `docs/changelog.md`, `docs/lessons.md`, `CLAUDE.md`. ✅
2. Scaffold Astro + React; remove Starlight. ✅
3. `data/roadmap.yaml` reshaped to the design's data, plus `src/lib/roadmap.ts` (Zod schema). ✅
4. `src/lib/plan.ts`: pure plan logic (phases with optional race, day dates, task blocks per day). `src/lib/plan.test.ts` runs with `node --test`. ✅
5. `src/lib/store.ts`: local and Supabase backends with the same `load / set / remove` shape. `supabase/migrations/0001_progress.sql` and `supabase/tests/rls_check.sql`. ✅ Migration applied to the `learning-hub` project with `supabase db push`; RLS check passed.
6. React app: `src/components/App.tsx` (shell, state, routing), `Dialogs.tsx`, one file per screen in `src/components/screens/`. ✅
7. CI (`.github/workflows/ci.yml`: test + build; `links.yml`: lychee on `data/roadmap.yaml` and docs, weekly issue on failure). `README.md` setup guide, `LICENSE`. ✅ Cloudflare project still to be connected.

## Future features

### Ask my learnings (real answers)

v0 ships the design's canned demo answers, labelled "Demo answers only". The real version:

- **Index:** Cloudflare AI Search over `data/roadmap.yaml`, the plan document and future Markdown notes. Free during open beta (20,000 queries/month, 4 MB per file on Workers Free).
- **Endpoint:** a small Cloudflare Worker (`/api/ask`) that queries the index and returns an answer with source titles, matching the chat's source chips.
- **Guardrails:** per-IP rate limit, max question length, hard monthly spend cap with the model provider, and retrieved text treated as data (prompt-injection defence from week 5).
- **Personal notes:** answering from a signed-in user's own daily log needs per-user filtering in the index. Leave it out until the public version works.
- **When:** after hub v0 is live. It doubles as a small RAG project for the portfolio.

### Backlog

- Import demo (`localStorage`) progress into Supabase on first sign-in.
- `verified_on` stale check (flag entries older than 90 days), enrichment and weekly-digest workflows.
- Markdown notes section (Starlight or plain Astro content collections).
- Public, read-only progress page per user.

## Verification

1. `npm test` passes (plan logic). `npm run build` passes; breaking one YAML field fails the build.
2. `npm run dev` in the browser: every screen matches the design in light and dark mode, at desktop width and at 375 px.
3. No env vars: public browsing works, "Continue as demo" saves to `localStorage`, reload keeps progress.
4. With Supabase: sign up with email (signed in immediately), sign out, sign in again on localhost; tick a task, log hours, write a note, save a story, add spend; reload and a second browser both show the same data.
5. `supabase/tests/rls_check.sql` passes in the SQL editor: user B sees none of user A's rows.
6. Settings: change start date, "Start today", skip race; day number, dates and week 8 range update.
7. CI green on a PR; Cloudflare preview URL loads.
