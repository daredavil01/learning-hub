# Lessons

Things that surprised us or cost time. Newest first. Format: date, what happened, what to do next time.

## 2026-09-25

- **Read the design before choosing the stack.** The plan picked Astro Starlight before the design was available. The design turned out to be a 12-screen interactive app with no docs pages, so Starlight was dropped for a React island. Next time: get the design files first, then choose the framework.
- **Claude Design exports run on a React runtime.** `support.js` in a `.dc.html` export is the Claude Design runtime (template + a `DCLogic` component class), not app code. Port the component logic and inline styles; do not ship `support.js`.
- **Claude Design MCP needs interactive login.** `DesignSync` kept failing with "needs design-system authorization" in the desktop app session, even after `/design-login` ran elsewhere. It also targets design-system projects, not `.dc.html` designs. Fastest path: export the design files into the repo.
- **Sign-in worked but loading failed with PGRST205.** Auth was ready before the `progress` table existed. The app now names the missing migration. `supabase link` + `supabase db push` applied it, and `supabase db query --linked -f …` ran the RLS check, all without the database password (the CLI uses a temporary login role).
- **Supabase `onAuthStateChange`: do not call Supabase inside the callback.** It can deadlock. Defer with `setTimeout(…, 0)`.
- **PostgREST returns at most 1,000 rows per request by default.** `supabaseStore.load()` pages with `.range()`; keep it that way if the table grows.
- **Cloudflare Pages builds with npm 10.9.2, even on Node 24.** A lockfile written by npm 11.6.2 on Windows failed `npm ci` there ("Missing: @emnapi/core@1.11.3 from lock file"). Regenerating it with `npx npm@10.9.2 install --package-lock-only` works for both npm 10 and 11. Check with `npx npm@10.9.2 ci --dry-run` before pushing lockfile changes.
- **Stop the dev server before `npm ci` on Windows.** It holds native binaries open, and `npm ci` fails while deleting `node_modules`.
- **Edit files with the Edit tool, not `sed -i`, while the dev server runs.** On Windows the Vite watcher missed `sed -i` rewrites of `hub.css`, so the browser showed stale styles until the dev server restarted.
- **Supabase free plan allows 2 active projects per organisation.** Check free slots before creating a project for the hub.
- **Flow-style YAML (`{ a: b, c: d }`) splits on commas.** `cost: ~₹1,900` inside braces would split the value; quote such values.
