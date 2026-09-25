// Small shared pieces: Lucide-style icons, the round check button, progress bars, a debounced note box.
import { useEffect, useRef, useState, type ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  down: <path d="m6 9 6 6 6-6" />,
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  plus: <path d="M5 12h14M12 5v14" />,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  sliders: <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />,
};

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

// The Learning Hub mark: a 60-day progress ring around a hub joining the three tracks
// (learn, build, interview). Same drawing as public/favicon.svg and public/logo.svg.
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="32" cy="32" r="32" fill="#c67139" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#fffaf2" strokeOpacity=".28" strokeWidth="4.5" />
      <path d="M32 10a22 22 0 1 1-22 22" fill="none" stroke="#fffaf2" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M32 32V21M32 32l9.5 5.5M32 32l-9.5 5.5" stroke="#fffaf2" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="21" r="3.8" fill="#ffc6a5" />
      <circle cx="41.5" cy="37.5" r="3.8" fill="#ccdbb2" />
      <circle cx="22.5" cy="37.5" r="3.8" fill="#fffaf2" />
      <circle cx="32" cy="32" r="4.6" fill="#fffaf2" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

export function Tick({ size = 11 }: { size?: number }) {
  return (
    <span className="tick">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-bg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

type CheckProps = { done: boolean; onClick: () => void; label: string; size?: 'sm' | 'lg' | 'xl' };
const TICK_SIZE = { sm: 10, lg: 14, xl: 15 };

export function Check({ done, onClick, label, size }: CheckProps) {
  return (
    <button type="button" className={`check ${size ?? ''}`} onClick={onClick} aria-label={label} aria-pressed={done}>
      {done && <Tick size={size ? TICK_SIZE[size] : 11} />}
    </button>
  );
}

export function Bar({ pct, color, className = '' }: { pct: number; color?: string; className?: string }) {
  return (
    <div className={`bar ${className}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

// Textarea that saves after a short pause and when it unmounts, so typing does not write every keystroke.
type NoteProps = {
  value: string;
  onSave: (text: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  className: string;
  placeholder: string;
  label: string;
};

export function NoteBox({ value, onSave, onFocus, className, placeholder, label }: NoteProps) {
  const [text, setText] = useState(value);
  const pending = useRef<string | null>(null);
  const save = useRef(onSave);
  save.current = onSave;

  // Take outside changes (e.g. data loaded after sign-in) only while the user has nothing unsaved.
  useEffect(() => {
    if (pending.current === null) setText(value);
  }, [value]);
  useEffect(() => {
    if (pending.current === null) return;
    const t = setTimeout(() => {
      if (pending.current !== null) save.current(pending.current);
      pending.current = null;
    }, 600);
    return () => clearTimeout(t);
  }, [text]);
  useEffect(() => () => {
    if (pending.current !== null) save.current(pending.current);
  }, []);

  return (
    <textarea
      className={className}
      value={text}
      aria-label={label}
      placeholder={placeholder}
      maxLength={5000}
      onFocus={onFocus}
      onChange={(e) => {
        pending.current = e.target.value;
        setText(e.target.value);
      }}
    />
  );
}

// Track colours: pill class (hub.css) and bar colour.
export const TRACK = {
  learn: { label: 'Learn', pill: 'warm', bar: 'var(--color-accent)' },
  build: { label: 'Build', pill: 'sage', bar: 'var(--color-accent-2)' },
  interview: { label: 'Interview', pill: 'gray', bar: 'var(--color-neutral-600)' },
  capture: { label: 'Capture', pill: 'gray', bar: 'var(--color-neutral-600)' },
} as const;

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const PRIORITY = {
  must: { label: 'Must', pill: 'warm' },
  recommended: { label: 'Recommended', pill: 'sage' },
  optional: { label: 'Optional', pill: 'gray' },
} as const;
