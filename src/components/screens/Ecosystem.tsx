import type { Hub } from '../App.tsx';

const TAG = { Standard: 'warm', Spec: 'sage', Security: 'hot', Tooling: 'gray', Acquisition: 'soft' } as const;

export default function Ecosystem({ hub }: { hub: Hub }) {
  return (
    <section className="screen" aria-label="Ecosystem" style={{ maxWidth: 900 }}>
      <div>
        <h1 className="h1">Ecosystem changes</h1>
        <p className="lede">What moved in 2026, what it means for the plan, and what to mention in interviews.</p>
      </div>
      <div className="stack">
        {hub.data.ecosystem.map((e) => (
          <div key={e.title} className="eco">
            <div className="stack" style={{ flex: '0 0 110px', gap: 6 }}>
              <span className="heading" style={{ fontSize: 16 }}>{e.date}</span>
              <span className={`pill ${TAG[e.tag]}`} style={{ alignSelf: 'flex-start' }}>{e.tag}</span>
            </div>
            <div className="stack" style={{ flex: '1 1 300px', minWidth: 0, gap: 3 }}>
              {e.url
                ? <a href={e.url} target="_blank" rel="noopener" style={{ fontWeight: 700, fontSize: 15 }}>{e.title}</a>
                : <span style={{ fontWeight: 700, fontSize: 15 }}>{e.title}</span>}
              <span className="muted pretty" style={{ fontSize: 13 }}>{e.meaning}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="panel sage" style={{ gap: 6 }}>
        <span className="title">Staying current</span>
        <span style={{ fontSize: 13 }}>Four sources at most, only in the weekend review slot: Anthropic Engineering, Hamel Husain, Simon Willison, Latent Space.</span>
      </div>
    </section>
  );
}
