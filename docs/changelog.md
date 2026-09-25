# Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Hub v0: all 12 screens from the Claude Design file (Today, Dashboard, Plan, Resources, Projects, Interview, Daily log, STAR stories, Checkpoints, Budget, Ecosystem, Ask my learnings), plus focus timer, dark mode and a mobile menu.
- `data/roadmap.yaml`: weeks, 55 resources, projects, checkpoints, 12 flashcards, DSA topics, mocks, costs and ecosystem changes, validated by Zod at build time.
- Per-user progress in Supabase with email + password sign-in (sign-up signs you in with no email confirmation; password reset by email). One `progress` table with row-level security, a 5,000-row cap per user, and an RLS check script.
- Demo mode that saves progress in `localStorage`; forks without Supabase get a working tracker.
- Settings: per-user start date, "Start today" reset, and a switch to skip the rest and race days.
- Migration `0001_progress.sql` applied to the `learning-hub` Supabase project with `supabase db push`; `rls_check.sql` passed against it.
- Clear error when the `progress` table is missing (PGRST205): tells you to run the migration.
- `npm test`: plan logic and roadmap validation with `node --test`.
- CI (test + build) and a weekly lychee link check that opens an issue on broken links.
- `README.md` (setup, fork, Supabase, deploy), `LICENSE`, `.env.example`, `CLAUDE.md`, `docs/plan.md`, `docs/lessons.md`.
- About screen (menu and footer): the plan, three tracks, daily rhythm, where progress is saved, how to fork. Content lives in `about` in `roadmap.yaml`.
- "Coming soon" notice on Ask my learnings; the demo chat stays until real answers ship.
- "Created by" screen: Sanket Tambare's bio and links (portfolio, projects, resume, Runfolio, Substack, GitHub, LinkedIn, now, contact). Content lives in `author` in `roadmap.yaml`; links taken from sankettambare.in and checked.
- Footer sitemap: every page, grouped into Plan, Learn and build, Interview, Explore and About.
- Build details for every week: tickable build steps, the core project with its deliverables, and build references. Shown under the build block on Today (Hide/Show) and for the selected week on Plan. Data: `project`, `build_steps`, `build_links` on each week in `roadmap.yaml`.
- Logo: a progress ring (the 60 days) around a hub joining the three tracks. `public/logo.svg` (mark + wordmark, text outlined to paths so it looks right without the fonts), `public/favicon.svg` (mark), and the same mark in the header (`LogoMark` in `ui.tsx`).
- Today links resources: the learn block's title opens its resource in a new tab, and a "Resources this week" panel lists the week's resources with links, done ticks and "Open in library".

### Fixed

- Cloudflare Pages build: `package-lock.json` regenerated with npm 10 so `npm ci` passes on Cloudflare (npm 10.9.2) and locally (npm 11).

### Changed

- Navigation: the header shows only Today, Dashboard, Plan and Resources. The "More" dropdown is gone; the menu button opens every page in the same five groups (a side panel on desktop, full screen on phones).
- App renamed to **Learning Hub** (header, browser tab, footer, README, docs). The name comes from `meta.name` in `roadmap.yaml`; the plan keeps its name, AI Architect 60-Day Plan.
- Stack: Astro + one React island instead of Astro Starlight. The design is an interactive app with no docs pages.
- Auth: email + password instead of GitHub OAuth.
