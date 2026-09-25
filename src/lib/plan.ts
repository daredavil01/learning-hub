// Pure plan logic shared by the app and its tests: phases, dates and the task blocks for each day.
import type { Resource, Roadmap, Week } from './roadmap.ts';

export type Track = 'learn' | 'build' | 'interview';
export type Settings = { startDate: string; skipRace: boolean };
export type Task = { id: string; kind: Track | 'capture'; hours: Track; min: number; title: string; sub: string; url?: string };

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MS_PER_DAY = 86_400_000;

// Local-time date from YYYY-MM-DD, so day boundaries follow the user's clock.
export const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Weeks for these settings. Skipping the race hands its days to the week before it.
export function phasesFor(weeks: Week[], skipRace: boolean): Week[] {
  if (!skipRace) return weeks;
  const out: Week[] = [];
  for (const w of weeks) {
    if (w.race) out[out.length - 1] = { ...out[out.length - 1], end: w.end };
    else out.push(w);
  }
  return out;
}

export function createPlan(data: Roadmap, settings: Settings) {
  const days = data.meta.days;
  const phases = phasesFor(data.weeks, settings.skipRace);
  const race = phases.find((w) => w.race);
  const start = parseDate(settings.startDate);

  const phaseOf = (d: number) => phases.find((p) => d >= p.start && d <= p.end)!;
  const dateOf = (d: number) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + d - 1);
  const dowOf = (d: number) => (dateOf(d).getDay() + 6) % 7; // Mon = 0 … Sun = 6
  const fmtD = (d: number) => {
    const x = dateOf(d);
    return `${x.getDate()} ${MON[x.getMonth()]}`;
  };
  const fmtLong = (d: number) => `${DOW[dowOf(d)]}, ${fmtD(d)}`;
  const fmtFull = (d: number) => `${fmtLong(d)} ${dateOf(d).getFullYear()}`;
  const isRestDay = (d: number) => !!race && d >= race.start && d < race.end;
  const isRaceDay = (d: number) => !!race && d === race.end;
  const label = (p: Week) => (p.number ? `Week ${p.number} · ${p.title}` : p.title);

  // Plan day for a calendar date, clamped to 1..days.
  const dayFor = (now: Date) => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const n = Math.round((today.getTime() - start.getTime()) / MS_PER_DAY) + 1;
    return Math.max(1, Math.min(days, n));
  };
  const startsIn = (now: Date) => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.round((start.getTime() - today.getTime()) / MS_PER_DAY));
  };

  const mustsByWeek = new Map<string, Resource[]>();
  for (const r of data.resources) {
    if (r.priority !== 'must') continue;
    mustsByWeek.set(r.week, [...(mustsByWeek.get(r.week) ?? []), r]);
  }

  // Weekdays: one learn block from the week's Must list, build, DSA on Tue/Thu, capture.
  // Weekends: deep build, design practice, weekly review. Final days: revise, polish, stories.
  function tasksFor(d: number): Task[] {
    const p = phaseOf(d);
    if (p.race) return [];
    const T = (i: number, kind: Task['kind'], hours: Track, min: number, title: string, sub = ''): Task => ({
      id: `d${d}-${i}`, kind, hours, min, title, sub,
    });
    const buildSub = p.build_sub ?? '';
    if (!p.number) {
      return [
        T(0, 'learn', 'learn', 45, 'Revise from your hub notes', 'Rewrite one week of notes as flashcard answers'),
        T(1, 'build', 'build', 45, p.build, buildSub),
        T(2, 'interview', 'interview', 30, d === p.start ? 'Behavioural mock (4th mock)' : 'Write two STAR stories', 'Use real eval numbers from your projects'),
      ];
    }
    const dow = dowOf(d);
    if (dow >= 5) {
      return [
        T(0, 'build', 'build', 135, `Deep build block · ${p.build}`, buildSub),
        T(1, 'interview', 'interview', 45, `Design practice: ${p.interview}`, 'One design or LLD problem, written up in the hub'),
        T(2, 'learn', 'learn', 30, 'Weekly review', 'Update progress, read your 3–4 sources, write a short weekly note'),
      ];
    }
    const musts = mustsByWeek.get(p.id) ?? [];
    const r = musts[dow % Math.max(1, musts.length)];
    const dsaDay = dow === 1 || dow === 3;
    const out = [
      r ? { ...T(0, 'learn', 'learn', 50, r.title, r.why), url: r.url } : T(0, 'learn', 'learn', 50, p.learn),
      T(1, 'build', 'build', dsaDay ? 25 : 55, p.build, buildSub),
    ];
    if (dsaDay && p.dsa) out.push(T(2, 'interview', 'interview', 30, `DSA: ${p.dsa}`, '2–3 NeetCode problems'));
    out.push(T(3, 'capture', 'learn', 15, 'Capture', 'Log what you learned in the hub'));
    return out;
  }

  const tasksByDay: Task[][] = [[]];
  for (let d = 1; d <= days; d++) tasksByDay.push(tasksFor(d));

  return { days, phases, race, phaseOf, dateOf, dowOf, fmtD, fmtLong, fmtFull, isRestDay, isRaceDay, label, dayFor, startsIn, tasksByDay };
}

export type Plan = ReturnType<typeof createPlan>;

export const fmtMin = (m: number) =>
  m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`;
export const fmtH = (h: number) => `${Math.round(h * 10) / 10} h`;
export const money = (n: number) => `$${n.toFixed(2)}`;
