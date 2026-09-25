import type { Hub } from '../App.tsx';
import { Tick } from '../ui.tsx';

export default function Checkpoints({ hub }: { hub: Hub }) {
  const { data, plan, today } = hub;
  const race = plan.race;
  const rows = [
    ...data.checkpoints.map((c) => ({ ...c, race: false })),
    ...(race ? [{ id: 'race', day: race.end, title: race.event ?? 'Race day', race: true }] : []),
  ].sort((a, b) => a.day - b.day);

  return (
    <section className="screen" aria-label="Checkpoints" style={{ maxWidth: 820 }}>
      <div>
        <h1 className="h1">Checkpoints</h1>
        <p className="lede">{hub.cpDone} of {data.checkpoints.length} done. Each one is something you can link to.</p>
      </div>
      <div className="stack" style={{ gap: 0 }}>
        {rows.map((c) => {
          const done = !c.race && hub.isOn('checkpoint', c.id);
          const due = c.day === today;
          const over = c.day < today && !done;
          const status = c.race ? 'Fixed date' : done ? 'Done' : due ? 'Due today' : over ? 'Overdue' : `In ${c.day - today} days`;
          const tag = done ? 'done' : !c.race && (over || due) ? 'solid' : 'gray';
          return (
            <div key={c.id} className="tl">
              <div className="tl-rail">
                <button
                  type="button"
                  className={`check xl ${c.race ? 'race-ring' : ''}`}
                  aria-label={c.race ? `Open day ${c.day}` : `Mark "${c.title}" done`}
                  aria-pressed={c.race ? undefined : done}
                  onClick={() => (c.race ? hub.setDay(c.day) : hub.toggle('checkpoint', c.id))}
                >
                  {done && <Tick size={15} />}
                  {c.race && <span className="tick race" />}
                </button>
              </div>
              <div className={`tl-card ${c.race ? 'race' : ''}`}>
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Day {c.day} · {plan.fmtLong(c.day)}</div>
                  <div className="pretty" style={{ fontWeight: 700, fontSize: 15 }}>{c.title}</div>
                </div>
                <span className={`pill ${tag}`} style={{ padding: '3px 10px' }}>{status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
