import { useState } from 'react';
import type { Hub } from '../App.tsx';
import { itemKey } from '../../lib/store.ts';
import { Bar, Icon, Tick } from '../ui.tsx';

type Rating = 'again' | 'good' | 'easy';

export default function Interview({ hub }: { hub: Hub }) {
  const { data, items } = hub;
  const qs = data.questions;
  const [i, setI] = useState(0);
  const [reveal, setReveal] = useState(false);
  const q = qs[i];
  const ratingOf = (id: string) => items[itemKey('flashcard', id)] as Rating | undefined;
  const count = (r: Rating) => qs.filter((x) => ratingOf(x.id) === r).length;
  const goTo = (n: number) => { setI((n + qs.length) % qs.length); setReveal(false); };
  const rate = (r: Rating) => hub.gate(() => { hub.write('flashcard', q.id, r); goTo(i + 1); })();

  const dsaTarget = data.dsa.reduce((a, t) => a + t.target, 0);
  const dsaCount = (id: string) => Number(items[itemKey('dsa', id)]) || 0;
  const dsaDone = data.dsa.reduce((a, t) => a + dsaCount(t.id), 0);
  const setDsa = (id: string, target: number, delta: number) => hub.gate(() => {
    const n = Math.max(0, Math.min(target, dsaCount(id) + delta));
    hub.write('dsa', id, n || undefined);
  })();
  const mocksDone = data.mocks.filter((m) => hub.isOn('mock', m.id)).length;

  return (
    <section className="screen" aria-label="Interview prep">
      <div>
        <h1 className="h1">Interview prep</h1>
        <p className="lede">Three rehearsed GenAI designs: enterprise RAG, an agent with approval, an LLM gateway. Cost, evals and safety get scored.</p>
      </div>
      <div className="cols">
        <div className="col-main" style={{ gap: 10 }}>
          <div className="flash">
            <div className="between" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="kicker">Question {i + 1} of {qs.length}</span>
              <div className="line" style={{ gap: 6 }}>
                <span className="pill warm" style={{ fontSize: 12 }}>Again {count('again')}</span>
                <span className="pill gray" style={{ fontSize: 12 }}>Good {count('good')}</span>
                <span className="pill sage" style={{ fontSize: 12 }}>Easy {count('easy')}</span>
              </div>
            </div>
            <h2 className="flash-q">{q.q}</h2>
            {!reveal ? (
              <div className="stack" style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                <span className="muted" style={{ fontSize: 13 }}>Answer out loud first, then reveal the outline.</span>
                <button type="button" className="btn-accent" style={{ fontSize: 15, padding: '10px 20px' }} onClick={() => setReveal(true)}>Reveal outline</button>
              </div>
            ) : (
              <>
                <div className="stack">
                  {q.points.map((t) => <div key={t} className="bullet pretty">{t}</div>)}
                </div>
                <div className="line" style={{ marginTop: 'auto' }}>
                  <button type="button" className="rate again" onClick={() => rate('again')}>Again</button>
                  <button type="button" className="rate good" onClick={() => rate('good')}>Good</button>
                  <button type="button" className="rate easy" onClick={() => rate('easy')}>Easy</button>
                </div>
              </>
            )}
          </div>
          <div className="between" style={{ alignItems: 'center' }}>
            <button type="button" className="btn-line" onClick={() => goTo(i - 1)}><Icon name="left" size={14} />Previous</button>
            <div className="qdots">
              {qs.map((x, n) => {
                const r = ratingOf(x.id);
                return <button key={x.id} type="button" aria-label={`Question ${n + 1}`} aria-current={n === i} className={r === 'easy' ? 'easy' : r ? 'rated' : ''} onClick={() => goTo(n)} />;
              })}
            </div>
            <button type="button" className="btn-line" onClick={() => goTo(i + 1)}>Next<Icon name="right" size={14} /></button>
          </div>
          <div className="panel" style={{ gap: 8 }}>
            <span className="title">What 2026 loops look like</span>
            {data.interview_loops.map((t) => <div key={t} className="bullet warm sm pretty">{t}</div>)}
          </div>
        </div>
        <aside className="col-side">
          <div className="panel">
            <div className="between"><span className="title">DSA</span><span style={{ fontSize: 13, fontWeight: 700 }}>{dsaDone} / {dsaTarget}</span></div>
            <span className="muted small">NeetCode 150, filtered. Tue and Thu, 30 minutes.</span>
            <Bar pct={(dsaDone / dsaTarget) * 100} color="var(--color-accent-2-600)" className="thick" />
            {data.dsa.map((t) => (
              <div key={t.id} className="line" style={{ fontSize: 13, flexWrap: 'nowrap' }}>
                <span className="grow">{t.label}</span>
                <button type="button" className="counter" aria-label={`${t.label} minus one`} onClick={() => setDsa(t.id, t.target, -1)}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontWeight: 700 }}>{dsaCount(t.id)}/{t.target}</span>
                <button type="button" className="counter plus" aria-label={`${t.label} plus one`} onClick={() => setDsa(t.id, t.target, 1)}>+</button>
              </div>
            ))}
          </div>
          <div className="panel" style={{ gap: 8 }}>
            <div className="between"><span className="title">Mocks</span><span style={{ fontSize: 13, fontWeight: 700 }}>{mocksDone} / {data.mocks.length}</span></div>
            {data.mocks.map((m) => {
              const done = hub.isOn('mock', m.id);
              return (
                <button key={m.id} type="button" className="tickrow" style={{ padding: '9px 12px' }} aria-pressed={done} onClick={() => hub.toggle('mock', m.id)}>
                  <span className="check sm" style={{ cursor: 'inherit' }}>{done && <Tick size={10} />}</span>
                  <span className="grow">{m.title}</span>
                  <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>{m.when}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
