// The hub: one React island. Owns auth mode, progress items, routing and dialogs; screens render from `hub`.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Roadmap } from '../lib/roadmap.ts';
import { createPlan, type Plan, type Task, type Track } from '../lib/plan.ts';
import { itemKey, localStore, supabase, supabaseStore, type Items, type Kind, type Store } from '../lib/store.ts';
import { Icon, LogoMark, newId } from './ui.tsx';
import { FocusMode, ResetPasswordDialog, SettingsDialog, SignInDialog, StarEditor } from './Dialogs.tsx';
import Today from './screens/Today.tsx';
import Dashboard from './screens/Dashboard.tsx';
import PlanScreen from './screens/Plan.tsx';
import Resources from './screens/Resources.tsx';
import Projects from './screens/Projects.tsx';
import Interview from './screens/Interview.tsx';
import Journal from './screens/Journal.tsx';
import Stars from './screens/Stars.tsx';
import Checkpoints from './screens/Checkpoints.tsx';
import Budget from './screens/Budget.tsx';
import Ecosystem from './screens/Ecosystem.tsx';
import Ask from './screens/Ask.tsx';
import About from './screens/About.tsx';
import Creator from './screens/Creator.tsx';

// Every page, grouped. The footer and the mobile menu list them all; the header shows only NAV_TOP.
const NAV_GROUPS = [
  ['Plan', [['today', 'Today'], ['dashboard', 'Dashboard'], ['plan', 'Plan'], ['checkpoints', 'Checkpoints']]],
  ['Learn and build', [['resources', 'Resources'], ['projects', 'Projects'], ['journal', 'Daily log'], ['budget', 'Budget']]],
  ['Interview', [['interview', 'Interview prep'], ['stars', 'STAR stories']]],
  ['Explore', [['ecosystem', 'Ecosystem'], ['ask', 'Ask my learnings']]],
  ['About', [['about', 'About'], ['creator', 'Created by']]],
] as const;
type NavLink = (typeof NAV_GROUPS)[number][1][number];
const NAV_ALL = NAV_GROUPS.flatMap(([, links]): readonly NavLink[] => links);
export type Page = NavLink[0];
const NAV_TOP: [Page, string][] = [['today', 'Today'], ['dashboard', 'Dashboard'], ['plan', 'Plan'], ['resources', 'Resources']];

const SCREENS: Record<Page, (p: { hub: Hub }) => React.ReactNode> = {
  today: Today, dashboard: Dashboard, plan: PlanScreen, resources: Resources, projects: Projects, interview: Interview,
  journal: Journal, stars: Stars, checkpoints: Checkpoints, budget: Budget, ecosystem: Ecosystem, ask: Ask, about: About, creator: Creator,
};

const MODE_KEY = 'ai60-mode';
const THEME_KEY = 'ai60-theme';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export type Mode = 'public' | 'demo' | 'user';
export type ResFilter = { q: string; week: string; cat: string; prio: string };
export type Spend = { id: string; prov: string; amt: number; note: string };
export type StarValue = { title: string; tags: string; s: string; t: string; a: string; r: string };

const readPage = (): Page => {
  const p = location.hash.replace(/^#\/?/, '');
  return NAV_ALL.some(([id]) => id === p) ? (p as Page) : 'today';
};
const safeGet = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string | null) => {
  try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage blocked */ }
};

export default function App({ data }: { data: Roadmap }) {
  const [mode, setMode] = useState<Mode>('public');
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Items>({});
  const [error, setError] = useState('');
  const [page, setPage] = useState<Page>(readPage);
  const [viewDay, setViewDay] = useState<number | null>(null);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [dialog, setDialog] = useState<null | 'signin' | 'settings' | 'reset'>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focus, setFocus] = useState<Task | null>(null);
  const [starEdit, setStarEdit] = useState<string | null>(null);
  const [resFilter, setResFilter] = useState<ResFilter>({ q: '', week: 'all', cat: 'all', prio: 'all' });

  const store = useRef<Store | null>(null);
  const loadSeq = useRef(0);
  const userId = useRef<string | null | undefined>(undefined);

  // — storage modes —
  const load = (s: Store) => {
    const seq = ++loadSeq.current;
    store.current = s;
    setItems({});
    s.load().then(
      (loaded) => { if (seq === loadSeq.current) setItems(loaded); },
      (err) => {
        console.error(err);
        // PGRST205: the table is not there yet (migration not run on this Supabase project).
        setError(err?.code === 'PGRST205'
          ? 'Progress storage is not set up yet: run supabase/migrations/0001_progress.sql in the Supabase SQL editor, then reload.'
          : "Couldn't load your progress. Reload to try again.");
      },
    );
  };
  const enterPublic = () => { loadSeq.current++; store.current = null; setItems({}); setMode('public'); setUser(null); };
  const enterDemo = () => { safeSet(MODE_KEY, 'demo'); setMode('demo'); setUser(null); load(localStore()); };
  const enterUser = (u: User) => { safeSet(MODE_KEY, null); setMode('user'); setUser(u); load(supabaseStore(supabase!, u.id)); };

  useEffect(() => {
    const demoSaved = safeGet(MODE_KEY) === 'demo';
    if (!supabase) {
      if (demoSaved) enterDemo();
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setDialog('reset');
      const id = session?.user.id ?? null;
      if (id === userId.current) return; // token refresh, same user
      userId.current = id;
      // Supabase warns against calling it from inside this callback, so defer.
      setTimeout(() => {
        if (session) enterUser(session.user);
        else if (safeGet(MODE_KEY) === 'demo') enterDemo();
        else enterPublic();
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = () => {
    setDialog(null);
    setMenuOpen(false);
    if (mode === 'user') supabase?.auth.signOut();
    else { safeSet(MODE_KEY, null); enterPublic(); }
  };

  // — writes: optimistic, reverted (except notes) if the store rejects them —
  const write = (kind: Kind, id: string, value: unknown, revert = true) => {
    const k = itemKey(kind, id);
    const prev = items[k];
    const put = (v: unknown) => setItems((cur) => {
      const next = { ...cur };
      if (v === undefined) delete next[k];
      else next[k] = v;
      return next;
    });
    put(value);
    const s = store.current;
    if (!s) return;
    (value === undefined ? s.remove(kind, id) : s.set(kind, id, value)).catch((err) => {
      console.error(err);
      setError("Couldn't save your last change. Check your connection and try again.");
      if (revert) put(prev);
    });
  };

  const signedIn = mode !== 'public';
  const gate = <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => {
    if (!signedIn) setDialog('signin');
    else fn(...a);
  };

  // — settings and plan —
  const savedStart = items[itemKey('setting', 'start_date')];
  const settings = {
    startDate: typeof savedStart === 'string' && ISO.test(savedStart) ? savedStart : data.meta.start_date,
    skipRace: items[itemKey('setting', 'skip_race')] === true,
  };
  const plan = useMemo(() => createPlan(data, settings), [data, settings.startDate, settings.skipRace]);
  const today = plan.dayFor(new Date());
  const day = Math.min(viewDay ?? today, plan.days);

  // — derived progress —
  const isOn = (kind: Kind, id: string) => !!items[itemKey(kind, id)];
  const hours: Record<Track, number> = { learn: 0, build: 0, interview: 0 };
  const spend: Spend[] = [];
  for (const [k, v] of Object.entries(items)) {
    if (k.startsWith('hours:')) {
      const e = v as { track: Track; h: number };
      if (e.track in hours) hours[e.track] += Number(e.h) || 0;
    } else if (k.startsWith('spend:')) {
      const e = v as Omit<Spend, 'id'>;
      spend.push({ id: k.slice(6), prov: e.prov, amt: Number(e.amt) || 0, note: e.note ?? '' });
    }
  }
  spend.sort((a, b) => b.id.localeCompare(a.id));
  const dayDone = (d: number) => plan.tasksByDay[d].filter((t) => isOn('task', t.id)).length;

  let streak = 0;
  for (let d = dayDone(today) || !plan.tasksByDay[today].length ? today : today - 1; d >= 1; d--) {
    if (!plan.tasksByDay[d].length) continue;
    if (!dayDone(d)) break;
    streak++;
  }
  const cpDone = data.checkpoints.filter((c) => isOn('checkpoint', c.id)).length;
  const nextCp = data.checkpoints.find((c) => c.day >= today && !isOn('checkpoint', c.id));

  const go = (p: Page) => {
    setMenuOpen(false);
    if (p === page) window.scrollTo(0, 0);
    else location.hash = `/${p}`;
  };
  const setDay = (d: number) => {
    setViewDay(Math.max(1, Math.min(plan.days, d)));
    go('today');
  };

  useEffect(() => {
    const onHash = () => { setPage(readPage()); window.scrollTo(0, 0); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false); setStarEdit(null);
      setDialog((d) => (d === 'reset' ? d : null));
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey); };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    safeSet(THEME_KEY, next);
    setTheme(next);
  };

  const hub = {
    data, plan, items, mode, signedIn, today, day, page,
    setDay, go, isOn, write, gate,
    toggle: (kind: Kind, id: string) => gate(() => write(kind, id, isOn(kind, id) ? undefined : true))(),
    hours, hoursTotal: hours.learn + hours.build + hours.interview,
    addHours: (track: Track, h: number) => gate(() => write('hours', newId(), { track, h, day: today }))(),
    spend, dayDone, streak, cpDone, nextCp,
    startFocus: (t: Task) => gate(() => setFocus(t))(),
    editStar: (id: string) => gate(() => setStarEdit(id))(),
    // Signed-out visitors can look at text boxes but typing opens sign-in instead.
    gateFocus: (e: React.FocusEvent<HTMLElement>) => {
      if (!signedIn) { e.target.blur(); setDialog('signin'); }
    },
    resFilter, setResFilter,
    openSignIn: () => setDialog('signin'),
  };

  const initials = mode === 'demo' ? 'DL' : (user?.email ?? '?').slice(0, 2).toUpperCase();
  const Screen = SCREENS[page];
  const starData = starEdit ? data.stars.find((s) => s.id === starEdit) : undefined;

  return (
    <div className="app">
      <header className="hdr">
        <div className="wrap hdr-in">
          <button type="button" className="brand" onClick={() => { setViewDay(null); go('today'); }}>
            <LogoMark size={36} />
            <span className="brand-name">{data.meta.name}</span>
          </button>
          <nav className="nav-main only-wide" aria-label="Main">
            {NAV_TOP.map(([id, label]) => (
              <button key={id} type="button" className="nav-btn" aria-current={page === id ? 'page' : undefined} onClick={() => go(id)}>{label}</button>
            ))}
          </nav>
          <div className="hdr-right">
            <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
            </button>
            {signedIn ? (
              <>
                <button type="button" className="avatar" title={mode === 'demo' ? 'Demo learner · settings' : `${user?.email} · settings`} aria-label="Settings" onClick={() => setDialog('settings')}>{initials}</button>
                <button type="button" className="btn-link only-wide" onClick={signOut}>Sign out</button>
              </>
            ) : (
              <button type="button" className="btn-accent" onClick={() => setDialog('signin')}>Sign in</button>
            )}
            <button type="button" className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => setMenuOpen(true)} aria-label="All pages" title="All pages">
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </header>

      {!signedIn && (
        <div className="banner">
          <div className="wrap banner-in">
            <span>You're browsing the public plan. Sign in to check off tasks, log hours and keep notes.</span>
            <button type="button" className="btn-line" onClick={() => setDialog('signin')}>Sign in or try the demo</button>
          </div>
        </div>
      )}
      {error && (
        <div className="banner error" role="alert">
          <div className="wrap banner-in">
            <span>{error}</span>
            <button type="button" className="btn-link" onClick={() => setError('')}>Dismiss</button>
          </div>
        </div>
      )}

      <main className="wrap main">
        <Screen hub={hub} />
      </main>

      <footer className="ftr">
        <nav className="wrap ftr-nav" aria-label="All pages">
          {NAV_GROUPS.map(([group, links]) => (
            <div key={group} className="ftr-group">
              <span className="label">{group}</span>
              {links.map(([id, label]) => (
                <button key={id} type="button" className="ftr-link" aria-current={page === id ? 'page' : undefined} onClick={() => go(id)}>
                  {id === 'creator' ? `Created by ${data.author.name}` : label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="wrap ftr-in">
          <span>{data.meta.name} · {data.meta.title}</span>
          <span>Notes CC BY 4.0 · Code MIT</span>
          <a href={data.meta.repo} target="_blank" rel="noopener">Fork this plan on GitHub</a>
        </div>
      </footer>

      {menuOpen && (
        <>
        <div className="sheet-backdrop" onClick={() => setMenuOpen(false)} />
        <div className="sheet" role="dialog" aria-modal="true" aria-label="All pages">
          <div className="sheet-hdr">
            <span className="heading" style={{ fontSize: 18 }}>All pages</span>
            <button type="button" className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => setMenuOpen(false)} aria-label="Close all pages"><Icon name="x" size={18} /></button>
          </div>
          <div className="sheet-groups">
            {NAV_GROUPS.map(([group, links]) => (
              <div key={group} className="stack" style={{ gap: 2 }}>
                <span className="label" style={{ padding: '0 16px' }}>{group}</span>
                {links.map(([id, label]) => (
                  <button key={id} type="button" className="nav-btn" aria-current={page === id ? 'page' : undefined} onClick={() => go(id)}>{label}</button>
                ))}
              </div>
            ))}
          </div>
          {signedIn && (
            <div className="line" style={{ margin: '8px 28px 24px' }}>
              <button type="button" className="btn-line" onClick={() => { setMenuOpen(false); setDialog('settings'); }}>Settings</button>
              <button type="button" className="btn-line" onClick={signOut}>Sign out</button>
            </div>
          )}
        </div>
        </>
      )}

      {dialog === 'signin' && (
        <SignInDialog onClose={() => setDialog(null)} onDemo={() => { setDialog(null); enterDemo(); }} />
      )}
      {dialog === 'reset' && <ResetPasswordDialog onClose={() => setDialog(null)} />}
      {dialog === 'settings' && signedIn && (
        <SettingsDialog
          plan={plan}
          settings={settings}
          defaultStart={data.meta.start_date}
          race={data.weeks.find((w) => w.race)}
          who={mode === 'demo' ? 'Demo mode · saved in this browser' : `Signed in as ${user?.email}`}
          onStart={(iso) => { write('setting', 'start_date', iso); setViewDay(null); }}
          onSkipRace={(skip) => write('setting', 'skip_race', skip ? true : undefined)}
          onSignOut={signOut}
          onClose={() => setDialog(null)}
        />
      )}
      {starData && (
        <StarEditor
          prompt={starData.prompt}
          initial={(items[itemKey('star', starData.id)] as StarValue | undefined) ?? starData.sample}
          onCancel={() => setStarEdit(null)}
          // An emptied story falls back to the slot's sample or prompt.
          onSave={(v) => { write('star', starData.id, Object.values(v).some((x) => x.trim()) ? v : undefined); setStarEdit(null); }}
        />
      )}
      {focus && (
        <FocusMode
          task={focus}
          day={day}
          onEnd={(spentHours, done) => {
            if (spentHours > 0) write('hours', newId(), { track: focus.hours, h: spentHours, day: today });
            if (done) write('task', focus.id, true);
            setFocus(null);
          }}
        />
      )}
    </div>
  );
}

export type Hub = {
  data: Roadmap;
  plan: Plan;
  items: Items;
  mode: Mode;
  signedIn: boolean;
  today: number;
  day: number;
  page: Page;
  setDay: (d: number) => void;
  go: (p: Page) => void;
  isOn: (kind: Kind, id: string) => boolean;
  write: (kind: Kind, id: string, value: unknown, revert?: boolean) => void;
  gate: <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => void;
  toggle: (kind: Kind, id: string) => void;
  hours: Record<Track, number>;
  hoursTotal: number;
  addHours: (track: Track, h: number) => void;
  spend: Spend[];
  dayDone: (d: number) => number;
  streak: number;
  cpDone: number;
  nextCp: Roadmap['checkpoints'][number] | undefined;
  startFocus: (t: Task) => void;
  editStar: (id: string) => void;
  gateFocus: (e: React.FocusEvent<HTMLElement>) => void;
  resFilter: ResFilter;
  setResFilter: (f: ResFilter) => void;
  openSignIn: () => void;
};
