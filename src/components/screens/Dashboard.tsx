import type { Hub } from '../App.tsx';
import { fmtH } from '../../lib/plan.ts';
import { Bar } from '../ui.tsx';
import { HoursRows } from './Today.tsx';

export default function Dashboard({ hub }: { hub: Hub }) {
  const { plan, data, today } = hub;
  const days = Array.from({ length: plan.days }, (_, i) => i + 1);
  const allTasks = days.reduce((a, d) => a + plan.tasksByDay[d].length, 0);
  const doneTasks = days.reduce((a, d) => a + hub.dayDone(d), 0);
  const resDone = data.resources.filter((r) => hub.isOn('resource', r.id)).length;
  const rated = data.questions.filter((q) => hub.isOn('flashcard', q.id)).length;
  const totalTarget = data.meta.hours.learn + data.meta.hours.build + data.meta.hours.interview;
  const race = plan.race;
  const cpDays = new Set(data.checkpoints.map((c) => c.day));

  const kpis = [
    { label: 'Plan progress', value: `${allTasks ? Math.round((doneTasks / allTasks) * 100) : 0}%`, sub: `${doneTasks} of ${allTasks} blocks` },
    { label: 'Hours logged', value: fmtH(hub.hoursTotal), sub: `of ~${totalTarget} h` },
    { label: 'Streak', value: `${hub.streak} day${hub.streak === 1 ? '' : 's'}`, sub: 'consecutive days with a block done' },
    { label: 'Checkpoints', value: `${hub.cpDone}/${data.checkpoints.length}`, sub: hub.nextCp ? `next on day ${hub.nextCp.day}` : 'all done' },
    { label: 'Resources', value: `${resDone}/${data.resources.length}`, sub: 'finished' },
    { label: 'Flashcards', value: `${rated}/${data.questions.length}`, sub: 'rated at least once' },
  ];

  return (
    <section className="screen" aria-label="Dashboard">
      <div>
        <h1 className="h1">Dashboard</h1>
        <p className="lede">
          Day {today} of {plan.days} · {plan.days - today} days left
          {race && ` · ${race.event ?? 'Race'} in ${today < race.end ? `${race.end - today} days` : 'done'}`}
        </p>
      </div>
      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.label} className="kpi">
            <span className="label">{k.label}</span>
            <b>{k.value}</b>
            <span className="muted small">{k.sub}</span>
          </div>
        ))}
      </div>
      <div className="cols">
        <div className="col-main panel" style={{ gap: 12 }}>
          <div className="between" style={{ flexWrap: 'wrap' }}>
            <span className="title">{plan.days} days</span>
            <div className="legend">
              <span><i className="c-none" />Not started</span>
              <span><i className="c-part" />Partial</span>
              <span><i className="c-done" />Done</span>
              {race && <span><i className="c-rest" />Rest / race</span>}
            </div>
          </div>
          <div className="daygrid">
            {days.map((d) => {
              const n = plan.tasksByDay[d].length;
              const k = hub.dayDone(d);
              const cls = !n ? 'c-rest' : k === n ? 'c-done' : k ? 'c-part' : 'c-none';
              return (
                <button key={d} type="button" className={`${cls} ${d === today ? 'is-today' : ''}`} title={`Day ${d} · ${plan.fmtLong(d)}`} onClick={() => hub.setDay(d)}>
                  {d}
                  {cpDays.has(d) && <span className="cp-dot" />}
                </button>
              );
            })}
          </div>
          <span className="muted small">Dot = checkpoint. Tap a day to open it.</span>
        </div>
        <div className="col-side">
          <div className="panel" style={{ gap: 12 }}>
            <span className="title">Hours by track</span>
            <HoursRows hub={hub} thick />
            <span className="muted small">Budget: 2 h weekdays, 3–4 h weekends ≈ 17 h/week.</span>
          </div>
          <div className="panel">
            <span className="title">Core projects</span>
            {data.projects.map((p) => {
              const n = data.deliverables.filter((_, i) => hub.isOn('deliverable', `${p.id}-${i}`)).length;
              return (
                <div key={p.id} className="proj-row">
                  <span className="proj-num">{p.number}</span>
                  <div className="grow">
                    <div className="ellipsis" style={{ fontWeight: 700, fontSize: 13 }}>{p.title}</div>
                    <Bar pct={(n / data.deliverables.length) * 100} color="var(--color-accent)" className="thin" />
                  </div>
                  <span className="muted small">{n}/{data.deliverables.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
