import type { Hub } from '../App.tsx';

const TRACKS = [['learn', 'Learn'], ['build', 'Build'], ['interview', 'Interview']] as const;

export default function About({ hub }: { hub: Hub }) {
  const { data, mode } = hub;
  const { meta, about } = data;
  const planUrl = `${meta.repo}/blob/main/${encodeURIComponent(meta.plan_doc)}`;

  return (
    <section className="screen" aria-label="About">
      <div>
        <h1 className="h1">About {meta.name}</h1>
        <p className="lede" style={{ maxWidth: 760 }}>{about.intro}</p>
      </div>
      <div className="cols">
        <div className="col-main">
          <div className="panel">
            <span className="title">The plan</span>
            <span className="muted" style={{ fontSize: 13 }}>
              {meta.title}: {meta.days} days, about {meta.hours.learn + meta.hours.build + meta.hours.interview} hours.{' '}
              <a href={planUrl} target="_blank" rel="noopener">Read the full plan</a>
            </span>
            {about.constraints.map((c) => (
              <div key={c.label} className="rowline">
                <span style={{ flex: '0 0 110px', fontWeight: 700 }}>{c.label}</span>
                <span className="muted" style={{ flex: '1 1 260px' }}>{c.value}</span>
              </div>
            ))}
          </div>
          <div className="panel">
            <span className="title">Three tracks, every week</span>
            <div className="tracks">
              {TRACKS.map(([k, label]) => (
                <div key={k} className={`track ${k}`}><span className="label">{label}</span><span>{about.tracks[k]}</span></div>
              ))}
            </div>
          </div>
          <div className="panel">
            <span className="title">Daily rhythm</span>
            <div className="tracks">
              {([['Weekdays · 2 h', about.rhythm.weekdays], ['Weekends · 3–4 h', about.rhythm.weekends]] as const).map(([label, list]) => (
                <div key={label} className="stack">
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
                  {list.map((t) => <div key={t} className="bullet sm pretty">{t}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="col-side">
          <div className="panel">
            <span className="title">Your progress</span>
            <span className="pretty" style={{ fontSize: 13 }}>
              {mode === 'user' && 'You are signed in, so ticks, hours, notes and stories sync to your account on every device.'}
              {mode === 'demo' && 'Demo mode: your progress saves in this browser only. Sign in to keep it in an account and use it on other devices.'}
              {mode === 'public' && 'You are browsing the public plan. Sign in to track your own progress, or try the demo, which saves in this browser.'}
            </span>
            {mode !== 'user' && <button type="button" className="btn-accent" style={{ alignSelf: 'flex-start' }} onClick={hub.openSignIn}>Sign in</button>}
            <span className="muted small">Pick your own start date, or skip the rest and race days, in Settings.</span>
          </div>
          <div className="panel sage" style={{ gap: 8 }}>
            <span className="title">Make it yours</span>
            <div className="bullet sm pretty">Fork the repository on GitHub.</div>
            <div className="bullet sm pretty">Edit <code>data/roadmap.yaml</code>: weeks, resources, projects, checkpoints and flashcards all live there.</div>
            <div className="bullet sm pretty">Deploy the static site; add a Supabase project if you want sign-in.</div>
            <a href={meta.repo} target="_blank" rel="noopener" style={{ fontWeight: 700, fontSize: 13 }}>Fork this plan on GitHub</a>
          </div>
          <div className="panel" style={{ gap: 6 }}>
            <span className="title">Credits</span>
            <span className="muted" style={{ fontSize: 13 }}>Resources link to their authors; non-commercially licensed repositories are linked, never copied. Built with Astro, React and Supabase, in the Organic design system.</span>
            <span className="muted small">Notes CC BY 4.0 · Code MIT</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
