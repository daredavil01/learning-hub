import { useState } from 'react';
import type { Hub } from '../App.tsx';
import { itemKey } from '../../lib/store.ts';
import { NoteBox } from '../ui.tsx';

const SAMPLE = `Learned: top-p cuts the long tail; temperature reshapes it.
Built: Astro scaffold + roadmap.yaml schema, CI green.
Stuck: lychee flags GitHub rate limits. Try a token.
Next: finish Karpathy part 2, deploy to the subdomain.`;

export default function Journal({ hub }: { hub: Hub }) {
  const { plan, items, today } = hub;
  const [sel, setSel] = useState(hub.day);
  const note = (d: number) => (items[itemKey('note', String(d))] as string | undefined) ?? '';
  const top = Math.max(today, hub.day);
  const days = Array.from({ length: top }, (_, i) => top - i).filter((d) => d === today || d === sel || note(d));
  const n = plan.tasksByDay[sel].length;

  return (
    <section className="screen" aria-label="Daily log">
      <div>
        <h1 className="h1">Daily log</h1>
        <p className="lede">Fifteen minutes of capture every day. Anything worth keeping becomes a hub note.</p>
      </div>
      <div className="cols">
        <div className="stack" style={{ flex: '1 1 280px', minWidth: 0, gap: 6 }}>
          {days.map((d) => (
            <button key={d} type="button" className={`entry ${d === sel ? 'is-sel' : ''}`} aria-pressed={d === sel} onClick={() => setSel(d)}>
              <span className="between"><span style={{ fontWeight: 700, fontSize: 14 }}>Day {d}</span><span className="muted small">{plan.fmtLong(d)}</span></span>
              <span className="muted ellipsis" style={{ fontSize: 13 }}>{note(d).split('\n')[0] || 'No entry yet'}</span>
            </button>
          ))}
          <div className="sample-box">
            <span className="line"><span className="pill sage">Sample</span><span style={{ fontWeight: 700, fontSize: 13 }}>What a good entry looks like</span></span>
            <span className="muted pre" style={{ fontSize: 13 }}>{SAMPLE}</span>
          </div>
        </div>
        <div className="panel lg" style={{ flex: '2 1 480px', minWidth: 0, gap: 12 }}>
          <div className="between" style={{ flexWrap: 'wrap' }}>
            <h2 className="h2" style={{ fontSize: 26, margin: 0 }}>Day {sel} · {plan.fmtLong(sel)}</h2>
            <span className="muted small">{n ? `${hub.dayDone(sel)} of ${n} blocks done` : 'Rest day'}</span>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>{plan.phaseOf(sel).title}</span>
          <NoteBox
            key={sel}
            className="capture tall"
            label={`Log for day ${sel}`}
            placeholder="Learned… Built… Stuck… Next…"
            value={note(sel)}
            onFocus={hub.gateFocus}
            onSave={(text) => hub.write('note', String(sel), text.trim() ? text : undefined, false)}
          />
          <span className="muted small">{hub.mode === 'user' ? 'Saved to your account automatically.' : 'Saved automatically in this browser.'}</span>
        </div>
      </div>
    </section>
  );
}
