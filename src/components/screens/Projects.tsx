import type { Hub } from '../App.tsx';
import { Tick } from '../ui.tsx';

export default function Projects({ hub }: { hub: Hub }) {
  const { data } = hub;
  return (
    <section className="screen" aria-label="Projects">
      <div>
        <h1 className="h1">Projects</h1>
        <p className="lede">Four upgrades to things already built, so every interview answer starts with a live link and real numbers.</p>
      </div>
      <div className="pcards">
        {data.projects.map((p) => {
          const ids = data.deliverables.map((_, i) => `${p.id}-${i}`);
          const n = ids.filter((id) => hub.isOn('deliverable', id)).length;
          return (
            <div key={p.id} className="panel" style={{ borderRadius: 28 }}>
              <div className="line" style={{ gap: 10, flexWrap: 'nowrap' }}>
                <span className="pnum">{p.number}</span>
                <div className="stack" style={{ gap: 0 }}>
                  <span className="kicker" style={{ letterSpacing: '.08em' }}>Weeks {p.weeks}</span>
                  <span className="muted small">{n}/{ids.length} deliverables</span>
                </div>
              </div>
              <h3 className="h3">{p.title}</h3>
              <p className="pretty" style={{ margin: 0, fontSize: 13 }}>{p.summary}</p>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 700 }}>Proves · </span><span className="muted">{p.proves}</span></div>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 700 }}>Study first · </span><span className="muted">{p.study}</span></div>
              <div className="stack" style={{ gap: 4, marginTop: 4 }}>
                {data.deliverables.map((label, i) => {
                  const done = hub.isOn('deliverable', ids[i]);
                  return (
                    <button key={label} type="button" className="tickrow" aria-pressed={done} onClick={() => hub.toggle('deliverable', ids[i])}>
                      <span className="check sm" style={{ cursor: 'inherit' }}>{done && <Tick size={10} />}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cols" style={{ gap: 12 }}>
        <div className="panel sage" style={{ flex: '1 1 300px', minWidth: 0, borderRadius: 28, gap: 8 }}>
          <span className="title">README template</span>
          <span style={{ fontSize: 13 }}>Your interview script, in {data.readme_template.length} parts.</span>
          {data.readme_template.map((t, i) => (
            <div key={t} className="line" style={{ gap: 10, fontSize: 13, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <span className="heading" style={{ width: 18, flex: 'none' }}>{i + 1}</span>
              <span className="pretty">{t}</span>
            </div>
          ))}
        </div>
        <div className="panel" style={{ flex: '2 1 480px', minWidth: 0, borderRadius: 28, gap: 6 }}>
          <span className="title">Already built</span>
          {data.existing_projects.map((e) => (
            <div key={e.name} className="rowline">
              <span style={{ flex: '1 1 200px', fontWeight: 700 }}>{e.name}</span>
              <span className="muted" style={{ flex: '2 1 240px' }}>{e.what}</span>
              <span className="pill warm" style={{ alignSelf: 'flex-start' }}>{e.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel" style={{ borderRadius: 28, gap: 6 }}>
        <span className="title">Ideas after research</span>
        {data.ideas.map((e) => (
          <div key={e.name} className="rowline">
            <span style={{ flex: '1 1 200px', fontWeight: 700 }}>{e.name}</span>
            <span className="muted" style={{ flex: '2 1 300px' }}>{e.verdict}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
