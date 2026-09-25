<img src="public/logo.svg" alt="Learning Hub" width="313">

# Learning Hub

A public, forkable tracker for the [AI Architect 60-Day Plan](AI%20Architect%2060-Day%20Plan%20—%20Consolidated.md): daily task blocks, a focus timer, hours by track, resources, projects, interview flashcards, STAR stories, checkpoints and an API-spend log. Live at [learn.sankettambare.in](https://learn.sankettambare.in).

- Signed out: browse the whole plan.
- **Continue as demo**: progress saves in this browser only. No account needed.
- **Sign in** (email + password): progress syncs to your account through Supabase.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:4321. Without Supabase settings the hub still works in demo mode.

```bash
npm test         # plan logic + roadmap.yaml validation
npm run build    # static site in dist/, fails if roadmap.yaml is invalid
```

## Make it yours (fork)

1. Edit `data/roadmap.yaml`: weeks, resources, projects, checkpoints, flashcards, costs. Keep existing `id`s stable once people have progress against them.
2. Change `meta.start_date` to your default start. Each user can still pick their own start date in Settings.
3. Remove `race: true` week if you have no race, or keep it: users can switch it off in Settings.

## Supabase setup (sign-in and sync)

1. Create a Supabase project (the free plan is enough).
2. Apply the migrations (creates the `progress` table with row-level security), with the [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   Or paste [`supabase/migrations/0001_progress.sql`](supabase/migrations/0001_progress.sql) into the **SQL Editor**.
3. Check row-level security. It should return `RLS check passed`, and it rolls back its test data:

   ```bash
   supabase db query --linked -f supabase/tests/rls_check.sql
   ```
4. In **Authentication → Sign In / Providers**, keep **Email** enabled and turn **Confirm email** off, so sign-up signs the user in straight away. (Turn it back on if you want verified addresses; the app then shows "Check your inbox" after sign-up.)
5. In **Authentication → URL Configuration**, set **Site URL** to your production URL and add both redirect URLs:
   - `http://localhost:4321`
   - `https://learn.sankettambare.in` (your domain)
6. Copy `.env.example` to `.env` and fill in the project URL and **publishable** key (Project Settings → API Keys). Never put the secret or `service_role` key here: everything in `PUBLIC_*` ships to the browser.

Password reset links open the hub and ask for a new password. Open the link in the same browser you requested it from.

## Deploy (Cloudflare)

Connect the GitHub repository in Cloudflare (Workers & Pages → Create → import repository):

- Build command: `npm run build`
- Output directory: `dist`
- Custom domain: `learn.sankettambare.in`

Set the Supabase values from `.env` with wrangler, so they never appear in a terminal or chat (repeat with `--env preview` for preview builds):

```bash
node --env-file=.env -e "process.stdout.write(process.env.PUBLIC_SUPABASE_URL)" | npx wrangler pages secret put PUBLIC_SUPABASE_URL --project-name learning-hub
node --env-file=.env -e "process.stdout.write(process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY)" | npx wrangler pages secret put PUBLIC_SUPABASE_PUBLISHABLE_KEY --project-name learning-hub
```

Every push to `main` then builds and deploys. Cloudflare installs with its own npm (10.x), so if you regenerate `package-lock.json`, check it with `npx npm@10.9.2 ci --dry-run`.

The site is static and uses hash routes (`#/resources`), so no server fallback is needed.

## How it's built

- Astro 7 + one React island (`src/components/App.tsx`); one file per screen (13 screens, including About) in `src/components/screens/`.
- `data/roadmap.yaml` → validated by Zod in `src/lib/roadmap.ts` at build time.
- `src/lib/plan.ts`: phases, dates and the task blocks for each day. Tested in `src/lib/plan.test.ts`.
- `src/lib/store.ts`: progress storage. One row per checkbox, note, story, spend or hours entry (`progress(user_id, kind, item_id, value)`), in Supabase when signed in or `localStorage` in demo mode.
- Styling: the Organic design system (`src/styles/organic.css`) plus `src/styles/hub.css`. Design source: the Claude Design export in `design-files/` (kept locally, not committed).

Plan, changelog and lessons: [`docs/`](docs/).

## Contributing

Fix a broken link or add a resource by editing `data/roadmap.yaml` and opening a pull request. CI runs the tests, the build and a link check. Link to non-commercially licensed repos (`license: link-only`); never copy their content.

## License

Code: MIT ([LICENSE](LICENSE)). Notes and plan content: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
