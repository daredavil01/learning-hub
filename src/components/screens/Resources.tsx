import { useState } from 'react';
import type { Hub } from '../App.tsx';
import type { Resource } from '../../lib/roadmap.ts';
import { Check, Icon, PRIORITY } from '../ui.tsx';

const CATEGORIES = ['video', 'course', 'docs', 'book', 'essay', 'repo', 'tool', 'standard'] as const;
const VIEW_KEY = 'ai60-res-view';
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export default function Resources({ hub }: { hub: Hub }) {
  const { data, resFilter: f, setResFilter } = hub;
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table'; } catch { return 'table'; }
  });
  const pickView = (v: 'table' | 'cards') => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage blocked */ }
  };

  const weeks = data.weeks.filter((w) => data.resources.some((r) => r.week === w.id));
  const weekShort = new Map(data.weeks.map((w) => [w.id, w.short]));
  const q = f.q.trim().toLowerCase();
  const list = data.resources.filter((r) =>
    (f.week === 'all' || r.week === f.week) &&
    (f.cat === 'all' || r.category === f.cat) &&
    (f.prio === 'all' || r.priority === f.prio) &&
    (!q || `${r.title} ${r.why}`.toLowerCase().includes(q)));
  const done = data.resources.filter((r) => hub.isOn('resource', r.id)).length;

  const title = (r: Resource, className?: string) =>
    r.url ? <a href={r.url} target="_blank" rel="noopener" className={className} style={{ fontWeight: className ? undefined : 700 }}>{r.title}</a>
      : <span className={className} style={{ fontWeight: className ? undefined : 700 }}>{r.title}</span>;
  const check = (r: Resource, size?: 'sm') => <Check size={size} done={hub.isOn('resource', r.id)} onClick={() => hub.toggle('resource', r.id)} label={`Mark "${r.title}" done`} />;
  const prio = (r: Resource) => <span className={`pill ${PRIORITY[r.priority].pill}`}>{PRIORITY[r.priority].label}</span>;
  const verified = (r: Resource) => r.verified_on
    ? <span className="verified" title={`Checked ${r.verified_on}`}>Verified</span>
    : <span className="recheck">Recheck</span>;

  return (
    <section className="screen" aria-label="Resources" style={{ gap: 16 }}>
      <div>
        <h1 className="h1">Resources</h1>
        <p className="lede">Finish the Must items; use the rest as references. {done} of {data.resources.length} done.</p>
      </div>
      <div className="line">
        <label className="search">
          <Icon name="search" size={15} />
          <input value={f.q} onChange={(e) => setResFilter({ ...f, q: e.target.value })} placeholder="Search resources" aria-label="Search resources" />
        </label>
        <select className="select" aria-label="Week" value={f.week} onChange={(e) => setResFilter({ ...f, week: e.target.value })}>
          <option value="all">All weeks</option>
          {weeks.map((w) => <option key={w.id} value={w.id}>{w.number ? `Week ${w.number}` : w.title}</option>)}
        </select>
        <select className="select" aria-label="Type" value={f.cat} onChange={(e) => setResFilter({ ...f, cat: e.target.value })}>
          <option value="all">All types</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
        </select>
        <select className="select" aria-label="Priority" value={f.prio} onChange={(e) => setResFilter({ ...f, prio: e.target.value })}>
          <option value="all">Any priority</option>
          {Object.entries(PRIORITY).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
        </select>
        <div className="seg2" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'table'} onClick={() => pickView('table')}>Table</button>
          <button type="button" aria-pressed={view === 'cards'} onClick={() => pickView('cards')}>Cards</button>
        </div>
      </div>
      <span className="muted small">Showing {list.length} · Verified = checked against a first-party page · Recheck = confirm before relying on it</span>

      {!list.length && (
        <div className="panel" style={{ padding: 28, alignItems: 'flex-start', gap: 8 }}>
          <span className="heading" style={{ fontSize: 20 }}>No matches</span>
          <span className="muted">Try another search or clear the filters.</span>
          <button type="button" className="btn-line" onClick={() => setResFilter({ q: '', week: 'all', cat: 'all', prio: 'all' })}>Clear filters</button>
        </div>
      )}

      {list.length > 0 && view === 'table' && (
        <div className="table-wrap">
          <table className="rtable">
            <thead>
              <tr>
                <th style={{ width: 36 }}><span className="sr-only">Done</span></th>
                <th>Resource</th><th>Week</th><th>Type</th><th>Cost</th><th>Time</th><th>Priority</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{check(r)}</td>
                  <td style={{ maxWidth: 420 }}>
                    {title(r)}
                    <div className="muted pretty small" style={{ marginTop: 2 }}>{r.why}</div>
                  </td>
                  <td className="nowrap">{weekShort.get(r.week)}</td>
                  <td>{r.type ?? cap(r.category)}</td>
                  <td>{r.cost}</td>
                  <td className="nowrap">{r.time}</td>
                  <td>{prio(r)}</td>
                  <td>{verified(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.length > 0 && view === 'cards' && (
        <div className="rcards">
          {list.map((r) => (
            <div key={r.id} className="rcard">
              <div className="line" style={{ gap: 6 }}>
                {prio(r)}
                <span className="kicker" style={{ letterSpacing: '.08em' }}>{weekShort.get(r.week)} · {r.type ?? cap(r.category)}</span>
              </div>
              {title(r, 'rcard-title')}
              <p className="muted pretty" style={{ margin: 0, fontSize: 13, flex: 1 }}>{r.why}</p>
              <div className="line muted small">
                <span>{r.time} · {r.cost}</span>
                <span style={{ marginLeft: 'auto' }}>{verified(r)}</span>
                {check(r)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
