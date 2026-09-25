import { useState } from 'react';
import type { Hub } from '../App.tsx';
import BuildDetails from '../BuildDetails.tsx';
import { Bar, Check, PRIORITY } from '../ui.tsx';

export default function PlanScreen({ hub }: { hub: Hub }) {
  const { plan, data, today } = hub;
  const cur = plan.phaseOf(today);
  const [selId, setSelId] = useState(cur.id);
  const sp = plan.phases.find((p) => p.id === selId) ?? cur;
  const first = plan.phases[0].start;
  const last = plan.phases[plan.phases.length - 1].end;

  const progress = (start: number, end: number) => {
    let n = 0, k = 0;
    for (let d = start; d <= end; d++) { n += plan.tasksByDay[d].length; k += hub.dayDone(d); }
    return n ? (k / n) * 100 : 0;
  };
  const range = (a: number, b: number) => (a === b ? `Day ${a}` : `Days ${a}–${b}`);
  const cp = data.checkpoints.find((c) => c.day >= sp.start && c.day <= sp.end);
  const res = data.resources.filter((r) => r.week === sp.id);
  const days = Array.from({ length: sp.end - sp.start + 1 }, (_, i) => sp.start + i);

  return (
    <section className="screen" aria-label="Plan">
      <div>
        <h1 className="h1">{plan.days}-day plan</h1>
        <p className="lede">{plan.fmtD(first)} – {plan.fmtFull(last).split(', ')[1]} · about {data.meta.hours.learn + data.meta.hours.build + data.meta.hours.interview} hours · Learn, Build and Interview every week</p>
      </div>
      <div className="cols">
        <div className="stack" style={{ flex: '1 1 320px', minWidth: 0, gap: 6 }}>
          {plan.phases.map((p) => (
            <button key={p.id} type="button" className={`phase ${p.id === sp.id ? 'is-sel' : ''} ${p.id === cur.id ? 'is-cur' : ''}`} onClick={() => setSelId(p.id)} aria-pressed={p.id === sp.id}>
              <span className="phase-badge">{p.short}</span>
              <div className="grow">
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                <div className="muted small">{range(p.start, p.end)} · {plan.fmtD(p.start)} – {plan.fmtD(p.end)}</div>
                <Bar pct={progress(p.start, p.end)} className="thin" />
              </div>
              {p.id === cur.id && <span className="pill solid">Now</span>}
            </button>
          ))}
        </div>
        <div className="col-main panel lg" style={{ gap: 16 }}>
          <div>
            <span className="kicker">{sp.number ? `Week ${sp.number} · ` : ''}{range(sp.start, sp.end)} · {plan.fmtD(sp.start)} – {plan.fmtD(sp.end)}</span>
            <h2 className="h2">{sp.title}</h2>
          </div>
          <div className="tracks">
            <div className="track learn"><span className="label">Learn</span><span>{sp.learn}</span></div>
            <div className="track build"><span className="label">Build</span><span>{sp.build}{sp.build_sub ? `. ${sp.build_sub}` : ''}</span></div>
            <div className="track interview"><span className="label">Interview</span><span>{sp.interview}</span></div>
          </div>
          {!!(sp.build_steps?.length || sp.project) && <BuildDetails hub={hub} week={sp} />}
          <div className="stack">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Days</span>
            <div className="line" style={{ gap: 6 }}>
              {days.map((d) => {
                const n = plan.tasksByDay[d].length;
                return (
                  <button key={d} type="button" className={`daychip ${d === today ? 'is-today' : ''}`} onClick={() => hub.setDay(d)}>
                    <span className="muted" style={{ fontSize: 11 }}>{plan.fmtLong(d).replace(',', '')}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Day {d}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{n ? `${hub.dayDone(d)}/${n} done` : plan.isRaceDay(d) ? 'Race' : 'Rest'}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {cp && (
            <div className="cp-strip">
              <span className="dot" />
              <span><strong>Checkpoint, day {cp.day}:</strong> {cp.title}</span>
            </div>
          )}
          {res.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              <div className="between" style={{ alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Resources this week</span>
                <button type="button" className="btn-link" onClick={() => { hub.setResFilter({ q: '', week: sp.id, cat: 'all', prio: 'all' }); hub.go('resources'); }}>Open in library</button>
              </div>
              {res.map((r) => (
                <div key={r.id} className="tile">
                  <Check done={hub.isOn('resource', r.id)} onClick={() => hub.toggle('resource', r.id)} label={`Mark "${r.title}" done`} />
                  <span className="grow" style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</span>
                  <span className="muted small nowrap">{r.time}</span>
                  <span className={`pill ${PRIORITY[r.priority].pill}`}>{PRIORITY[r.priority].label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
