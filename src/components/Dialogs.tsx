// Overlays: sign-in (email + password via Supabase, or demo), password reset, settings, STAR editor, focus timer.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/store.ts';
import { fmtMin, toIso, type Plan, type Settings, type Task } from '../lib/plan.ts';
import type { Week } from '../lib/roadmap.ts';
import type { StarValue } from './App.tsx';
import { Icon, TRACK } from './ui.tsx';

function Modal({ title, onClose, wide, blob, children }: { title: string; onClose?: () => void; wide?: boolean; blob?: boolean; children: ReactNode }) {
  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`dlg ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        {blob && <div className="blob" />}
        <span id="dlg-title" className="dlg-title">{title}</span>
        {children}
      </div>
    </div>
  );
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');
const redirectTo = () => location.origin + location.pathname;

export function SignInDialog({ onClose, onDemo }: { onClose: () => void; onDemo: () => void }) {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const switchTo = (v: typeof view) => { setView(v); setMsg(''); setErr(''); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      if (view === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else if (view === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        if (data.session) onClose();
        else setMsg('Check your inbox to confirm your email, then sign in.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
        if (error) throw error;
        setMsg('If an account exists for that email, a reset link is on its way. Open it in this browser.');
      }
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const titles = { signin: 'Track your 60 days', signup: 'Create your account', forgot: 'Reset your password' };
  const actions = { signin: 'Sign in', signup: 'Create account', forgot: 'Send reset link' };

  return (
    <Modal title={titles[view]} onClose={onClose} blob>
      <span className="muted pretty" style={{ fontSize: 14 }}>
        Check off tasks, log hours, run focus timers and keep notes.
        {supabase ? ' Sign in to sync across devices, or try the demo, which saves in this browser only.' : ' The demo saves progress in this browser. No account needed.'}
      </span>
      {supabase && (
        <form onSubmit={submit}>
          <input className="field-pill" type="email" required autoFocus autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {view !== 'forgot' && (
            <input
              className="field-pill" type="password" required minLength={view === 'signup' ? 8 : undefined}
              autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
              placeholder={view === 'signup' ? 'Password (8+ characters)' : 'Password'} aria-label="Password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {err && <span role="alert" style={{ color: 'var(--color-accent-700)', fontSize: 13, fontWeight: 700 }}>{err}</span>}
          {msg && <span role="status" style={{ fontSize: 13, fontWeight: 700 }}>{msg}</span>}
          <button type="submit" className="btn-accent lg" disabled={busy}>{busy ? 'Please wait…' : actions[view]}</button>
          <div className="line" style={{ justifyContent: 'space-between' }}>
            {view === 'signin' ? (
              <>
                <button type="button" className="btn-link" onClick={() => switchTo('signup')}>Create an account</button>
                <button type="button" className="btn-link" onClick={() => switchTo('forgot')}>Forgot password?</button>
              </>
            ) : (
              <button type="button" className="btn-link" onClick={() => switchTo('signin')}>Back to sign in</button>
            )}
          </div>
        </form>
      )}
      <button type="button" className={supabase ? 'btn-line' : 'btn-accent lg'} style={{ justifyContent: 'center', marginTop: 6 }} onClick={onDemo}>Continue as demo</button>
      <button type="button" className="btn-link" onClick={onClose}>Keep browsing</button>
    </Modal>
  );
}

export function ResetPasswordDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(errorText(error));
    else setDone(true);
  };

  return (
    <Modal title="Choose a new password" onClose={done ? onClose : undefined}>
      {done ? (
        <>
          <span>Password updated. You're signed in.</span>
          <button type="button" className="btn-accent lg" onClick={onClose}>Continue</button>
        </>
      ) : (
        <form onSubmit={submit}>
          <input className="field-pill" type="password" required minLength={8} autoFocus autoComplete="new-password" placeholder="New password (8+ characters)" aria-label="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <span role="alert" style={{ color: 'var(--color-accent-700)', fontSize: 13, fontWeight: 700 }}>{err}</span>}
          <button type="submit" className="btn-accent lg" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
        </form>
      )}
    </Modal>
  );
}

type SettingsProps = {
  plan: Plan;
  settings: Settings;
  defaultStart: string;
  race: Week | undefined;
  who: string;
  onStart: (iso: string) => void;
  onSkipRace: (skip: boolean) => void;
  onSignOut: () => void;
  onClose: () => void;
};

export function SettingsDialog({ plan, settings, defaultStart, race, who, onStart, onSkipRace, onSignOut, onClose }: SettingsProps) {
  const now = new Date();
  const wait = plan.startsIn(now);
  return (
    <Modal title="Settings" onClose={onClose} blob>
      <span className="muted small">{who}</span>
      <label className="stack" style={{ gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Start date (day 1)</span>
        <input
          className="field-pill" type="date" value={settings.startDate} required
          onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && onStart(e.target.value)}
        />
      </label>
      <span className="muted small">
        {wait ? `Starts in ${wait} day${wait === 1 ? '' : 's'}` : `Today is day ${plan.dayFor(now)} of ${plan.days}`} · ends {plan.fmtFull(plan.days)}
      </span>
      <div className="line">
        <button type="button" className="btn-line" onClick={() => onStart(toIso(now))}>Start today</button>
        {settings.startDate !== defaultStart && (
          <button type="button" className="btn-link" onClick={() => onStart(defaultStart)}>Use plan default ({defaultStart})</button>
        )}
      </div>
      {race && (
        <label className="toggle">
          <input type="checkbox" checked={!settings.skipRace} onChange={(e) => onSkipRace(!e.target.checked)} />
          <span>Include rest and race days ({race.start}–{race.end}{race.event ? `, ${race.event}` : ''}). Off: the week before runs to day {race.end}.</span>
        </label>
      )}
      <div className="line" style={{ justifyContent: 'space-between', marginTop: 6 }}>
        <button type="button" className="btn-line" onClick={onSignOut}>Sign out</button>
        <button type="button" className="btn-accent" onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

const STAR_FIELDS = [['s', 'Situation'], ['t', 'Task'], ['a', 'Action'], ['r', 'Result, with a number']] as const;

export function StarEditor({ prompt, initial, onSave, onCancel }: { prompt: string; initial?: StarValue; onSave: (v: StarValue) => void; onCancel: () => void }) {
  const [v, setV] = useState<StarValue>(initial ?? { title: '', tags: '', s: '', t: '', a: '', r: '' });
  const field = (k: keyof StarValue) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal title={initial?.title ? 'Edit story' : prompt} onClose={onCancel} wide>
      <form onSubmit={(e) => { e.preventDefault(); onSave(v); }}>
        <input className="field-pill" style={{ fontSize: 14 }} placeholder="Story title" aria-label="Story title" maxLength={200} value={v.title} onChange={field('title')} autoFocus />
        <input className="field-pill" placeholder="Themes, e.g. Ownership · Technical depth" aria-label="Themes" maxLength={200} value={v.tags} onChange={field('tags')} />
        {STAR_FIELDS.map(([k, label]) => (
          <textarea key={k} className="area" placeholder={label} aria-label={label} maxLength={1500} value={v[k]} onChange={field(k)} />
        ))}
        <div className="line" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" className="btn-line" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-accent">Save story</button>
        </div>
      </form>
    </Modal>
  );
}

const CIRC = 816.8; // 2πr for r = 130

// Counts down against a wall-clock end time, so a throttled background tab stays accurate.
export function FocusMode({ task, day, onEnd }: { task: Task; day: number; onEnd: (spentHours: number, done: boolean) => void }) {
  const [total, setTotal] = useState(task.min * 60);
  const [left, setLeft] = useState(task.min * 60);
  const [running, setRunning] = useState(true);
  const endAt = useRef(Date.now() + task.min * 60_000);
  const ended = useRef(false);

  const finish = (done: boolean, remaining = left) => {
    if (ended.current) return;
    ended.current = true;
    onEnd((total - remaining) / 3600, done);
  };

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) finish(true, 0);
    }, 500);
    return () => clearInterval(t);
  });

  const toggle = () => {
    if (!running) endAt.current = Date.now() + left * 1000;
    setRunning(!running);
  };
  const add5 = () => {
    endAt.current += 300_000;
    setTotal(total + 300);
    setLeft(left + 300);
  };
  const tr = TRACK[task.kind];
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="focus" role="dialog" aria-modal="true" aria-label="Focus timer">
      <div className="focus-hdr">
        <span className={`pill ${tr.pill}`} style={{ fontSize: 12, padding: '4px 12px' }}>{tr.label} · Day {day}</span>
        <button type="button" className="btn-line" onClick={() => finish(false)}><Icon name="x" size={14} />Exit</button>
      </div>
      <div className="focus-body">
        <div className="ring">
          <svg viewBox="0 0 300 300" aria-hidden="true">
            <circle cx="150" cy="150" r="130" fill="none" stroke="var(--color-neutral-200)" strokeWidth="18" />
            <circle cx="150" cy="150" r="130" fill="none" stroke="var(--color-accent)" strokeWidth="18" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - left / total)} />
          </svg>
          <div className="ring-in">
            <span className="ring-time" role="timer">{mm}:{ss}</span>
            <span className="muted" style={{ fontSize: 13, marginTop: 6 }}>of {fmtMin(Math.round(total / 60))}</span>
          </div>
        </div>
        <div className="stack" style={{ maxWidth: 560, gap: 6 }}>
          <span className="heading pretty" style={{ fontSize: 'clamp(20px,3vw,26px)', lineHeight: 1.2 }}>{task.title}</span>
          <span className="muted pretty" style={{ fontSize: 13 }}>{task.sub}</span>
        </div>
        <div className="line" style={{ justifyContent: 'center', gap: 10 }}>
          <button type="button" className="btn-accent lg" style={{ minWidth: 130 }} onClick={toggle}>{running ? 'Pause' : 'Resume'}</button>
          <button type="button" className="btn-line" style={{ padding: '12px 18px' }} onClick={add5}>+5 min</button>
          <button type="button" className="sage-btn" onClick={() => finish(true)}>Mark done</button>
        </div>
        <span className="muted small">Time spent counts toward {TRACK[task.hours].label} hours, even if you exit early.</span>
      </div>
    </div>
  );
}
