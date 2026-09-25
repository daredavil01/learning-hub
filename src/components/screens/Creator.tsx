import type { Hub } from '../App.tsx';
import { Icon } from '../ui.tsx';

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export default function Creator({ hub }: { hub: Hub }) {
  const { author, meta } = hub.data;
  return (
    <section className="screen" aria-label="Created by">
      <div className="cols">
        <div className="col-main">
          <div className="hero rest" style={{ gap: 14 }}>
            <div className="blob" style={{ right: -70, top: -70, width: 240, height: 240, background: 'var(--color-accent-2-300)' }} />
            <span className="kicker" style={{ color: 'inherit' }}>Created by</span>
            <div className="line" style={{ gap: 16, flexWrap: 'nowrap' }}>
              <span className="pnum" style={{ width: 64, height: 64, fontSize: 24, background: 'var(--color-accent)' }} aria-hidden="true">{initials(author.name)}</span>
              <div className="stack" style={{ gap: 2 }}>
                <h1 style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>{author.name}</h1>
                <span style={{ fontWeight: 700 }}>{author.role}</span>
              </div>
            </div>
          </div>
          <div className="panel" style={{ gap: 12 }}>
            {author.bio.map((p) => <p key={p} className="pretty" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{p}</p>)}
          </div>
          <div className="panel warm" style={{ gap: 6 }}>
            <span className="title">Why {meta.name} is public</span>
            <span className="pretty" style={{ fontSize: 13 }}>
              Learning in the open keeps the plan honest: every resource, build and checkpoint is visible, and anyone can fork the plan and track their own {meta.days} days.
            </span>
            <button type="button" className="btn-link" style={{ alignSelf: 'flex-start', padding: '4px 0' }} onClick={() => hub.go('about')}>About this hub</button>
          </div>
        </div>
        <aside className="col-side">
          <div className="panel" style={{ gap: 4 }}>
            <span className="title" style={{ marginBottom: 4 }}>Links</span>
            {author.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener me" className="linkrow">
                <span className="grow stack" style={{ gap: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{l.label}</span>
                  {l.note && <span className="muted small">{l.note}</span>}
                </span>
                <Icon name="right" size={14} />
              </a>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
