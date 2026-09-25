import { useState, type FormEvent } from 'react';
import type { Hub } from '../App.tsx';
import { money } from '../../lib/plan.ts';
import { Bar, Icon, newId } from '../ui.tsx';

const PROVIDERS = ['Anthropic', 'OpenAI', 'Gemini', 'Other'];

export default function Budget({ hub }: { hub: Hub }) {
  const { data, spend } = hub;
  const cap = data.meta.budget_cap_usd;
  const [prov, setProv] = useState(PROVIDERS[0]);
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const total = spend.reduce((a, e) => a + e.amt, 0);

  const add = (e: FormEvent) => {
    e.preventDefault();
    hub.gate(() => {
      const n = Number.parseFloat(amt);
      if (!(n > 0 && n < 10_000)) return;
      hub.write('spend', newId(), { prov, amt: Math.round(n * 100) / 100, note: note.trim(), day: hub.today });
      setAmt('');
      setNote('');
    })();
  };

  return (
    <section className="screen" aria-label="Budget">
      <div>
        <h1 className="h1">Budget</h1>
        <p className="lede">At most {money(cap).replace('.00', '')} a month for LLM APIs and cloud. Everything else runs on free tiers or timed trials.</p>
      </div>
      <div className="cols">
        <div className="stack" style={{ flex: '1 1 340px', minWidth: 0, gap: 12 }}>
          <div className="panel" style={{ borderRadius: 28 }}>
            <span className="label">API spend logged</span>
            <div className="line" style={{ alignItems: 'baseline' }}>
              <span className="bignum">{money(total)}</span>
              <span className="muted">of {money(cap)} cap</span>
            </div>
            <Bar pct={(total / cap) * 100} color={total > cap * 0.8 ? 'var(--color-accent)' : 'var(--color-accent-2-500)'} className="xl" />
            <span className="muted small">{money(Math.max(0, cap - total))} left · set hard spend caps with each provider</span>
          </div>
          <form className="panel" style={{ borderRadius: 28 }} onSubmit={add}>
            <span className="title">Log spend</span>
            <div className="line">
              <select className="field-pill" style={{ flex: '1 1 130px', fontWeight: 600 }} aria-label="Provider" value={prov} onChange={(e) => setProv(e.target.value)}>
                {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <input className="field-pill" style={{ flex: '1 1 100px' }} inputMode="decimal" placeholder="Amount, $" aria-label="Amount in dollars" value={amt} onFocus={hub.gateFocus} onChange={(e) => setAmt(e.target.value)} />
            </div>
            <input className="field-pill" placeholder="What for? e.g. contextual retrieval run" aria-label="What for" maxLength={200} value={note} onFocus={hub.gateFocus} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className="btn-accent" style={{ alignSelf: 'flex-start', padding: '8px 18px' }}>Add entry</button>
            {!spend.length && <span className="muted" style={{ fontSize: 13 }}>No spend logged yet. Cost logging starts in week 2.</span>}
            {spend.map((e) => (
              <div key={e.id} className="spend-row">
                <span style={{ fontWeight: 700, width: 78, flex: 'none' }}>{e.prov}</span>
                <span className="grow muted ellipsis">{e.note || 'API usage'}</span>
                <span style={{ fontWeight: 700 }}>{money(e.amt)}</span>
                <button type="button" className="icon-btn" style={{ width: 24, height: 24, border: 0 }} aria-label={`Remove ${money(e.amt)} ${e.prov}`} onClick={() => hub.gate(() => hub.write('spend', e.id, undefined))()}>
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
          </form>
        </div>
        <div className="col-main">
          <div className="panel" style={{ borderRadius: 28, gap: 4 }}>
            <span className="title" style={{ marginBottom: 4 }}>Where the money goes</span>
            {data.costs.map((c) => (
              <div key={c.item} className="rowline">
                <span style={{ flex: '1 1 180px', fontWeight: 700 }}>{c.item}</span>
                <span style={{ flex: '0 0 130px', fontWeight: 700, color: 'var(--color-accent-700)' }}>{c.cost}</span>
                <span className="muted" style={{ flex: '2 1 220px' }}>{c.note}</span>
              </div>
            ))}
          </div>
          <div className="panel warm" style={{ borderRadius: 28, gap: 6 }}>
            <span className="title">Biggest budget risks</span>
            <span style={{ fontSize: 13 }}>Running a full Microsoft GraphRAG index, and re-running LLM judges over the whole eval set on every change.</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Cache judge outputs keyed by a hash of (input, output, judge prompt).</span>
          </div>
        </div>
      </div>
    </section>
  );
}
