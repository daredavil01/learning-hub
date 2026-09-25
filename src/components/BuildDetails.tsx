// A week's build details: tickable steps, the core project with its deliverables, and references.
// Used on Today (under the build block) and on Plan (selected week).
import type { Hub } from './App.tsx';
import type { Week } from '../lib/roadmap.ts';
import { Bar, Tick } from './ui.tsx';

// Stored as `task` items; ids are the step's position, so new steps go at the end of the list.
const stepId = (week: string, i: number) => `build-${week}-${i}`;

export default function BuildDetails({ hub, week }: { hub: Hub; week: Week }) {
  const steps = week.build_steps ?? [];
  const project = week.project ? hub.data.projects.find((p) => p.id === week.project) : undefined;
  const done = steps.filter((_, i) => hub.isOn('task', stepId(week.id, i))).length;

  return (
    <div className="build-details">
      {steps.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          <div className="between">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Build steps{week.number ? ` · week ${week.number}` : ''}</span>
            <span className="muted small">{done}/{steps.length}</span>
          </div>
          <Bar pct={(done / steps.length) * 100} color="var(--color-accent-2-600)" className="thin" />
          {steps.map((s, i) => {
            const id = stepId(week.id, i);
            const on = hub.isOn('task', id);
            return (
              <button key={id} type="button" className="tickrow" aria-pressed={on} onClick={() => hub.toggle('task', id)}>
                <span className="check sm" style={{ cursor: 'inherit' }}>{on && <Tick size={10} />}</span>
                <span className="grow pretty" style={{ fontWeight: 500, textDecoration: on ? 'line-through' : undefined }}>{s}</span>
              </button>
            );
          })}
        </div>
      )}
      {project && (
        <div className="stack" style={{ gap: 5 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Project · Core {project.number}: {project.title}</span>
          <span className="muted pretty" style={{ fontSize: 13 }}>{project.summary}</span>
          <span style={{ fontSize: 13 }}><strong>Proves · </strong><span className="muted">{project.proves}</span></span>
          <span style={{ fontSize: 13 }}><strong>Study first · </strong><span className="muted">{project.study}</span></span>
          <div className="line" style={{ gap: 6 }}>
            {hub.data.deliverables.map((d, i) => {
              const id = `${project.id}-${i}`;
              const on = hub.isOn('deliverable', id);
              return (
                <button key={id} type="button" className={`pill pill-btn ${on ? 'done' : 'gray'}`} aria-pressed={on} onClick={() => hub.toggle('deliverable', id)}>
                  {on ? '✓ ' : ''}{d}
                </button>
              );
            })}
            <button type="button" className="btn-link" onClick={() => hub.go('projects')}>All projects</button>
          </div>
        </div>
      )}
      {!!week.build_links?.length && (
        <div className="line" style={{ gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>References</span>
          {week.build_links.map((l) => (
            <a key={l.url} className="chip" href={l.url} target="_blank" rel="noopener">{l.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}
