import { useState } from 'react';
import type { Hub } from '../App.tsx';
import BuildDetails from '../BuildDetails.tsx';
import { fmtH, fmtMin, type Track } from '../../lib/plan.ts';
import { itemKey } from '../../lib/store.ts';
import { Bar, Check, Icon, NoteBox, PlayIcon, PRIORITY, TRACK } from '../ui.tsx';

const TRACKS: Track[] = ['learn', 'build', 'interview'];

// Hours logged per track against the plan's targets; `quickAdd` shows the +15m/+30m/+1h buttons.
export function HoursRows({ hub, quickAdd, thick }: { hub: Hub; quickAdd?: boolean; thick?: boolean }) {
  const target = hub.data.meta.hours;
  return TRACKS.map((k) => (
    <div key={k} className="stack" style={{ gap: 5 }}>
      <div className="between" style={{ fontSize: 13 }}>
        <span style={{ fontWeight: 700 }}>{TRACK[k].label}</span>
        <span className="muted">{fmtH(hub.hours[k])} / {target[k]} h</span>
      </div>
      <Bar pct={(hub.hours[k] / target[k]) * 100} color={TRACK[k].bar} className={thick ? 'thick' : ''} />
      {quickAdd && (
        <div className="line" style={{ gap: 6 }}>
          {([[0.25, '+15m'], [0.5, '+30m'], [1, '+1h']] as const).map(([h, label]) => (
            <button key={label} type="button" className="btn-line sm" onClick={() => hub.addHours(k, h)} aria-label={`Add ${label.slice(1)} to ${TRACK[k].label}`}>{label}</button>
          ))}
        </div>
      )}
    </div>
  ));
}

export default function Today({ hub }: { hub: Hub }) {
  const { plan, day, today, data } = hub;
  const ph = plan.phaseOf(day);
  const tasks = plan.tasksByDay[day];
  const done = hub.dayDone(day);
  const planned = tasks.reduce((a, t) => a + t.min, 0);
  const startsIn = plan.startsIn(new Date());
  const totalTarget = data.meta.hours.learn + data.meta.hours.build + data.meta.hours.interview;
  const race = plan.race;
  const heading = !ph.number ? 'Final stretch' : plan.dowOf(day) >= 5 ? 'Weekend deep work' : day === today ? 'Today' : `Day ${day}`;
  const nc = hub.nextCp;
  const [showBuild, setShowBuild] = useState(true);
  const hasBuildDetails = !!(ph.build_steps?.length || ph.project || ph.build_links?.length);
  const weekRes = data.resources.filter((r) => r.week === ph.id);
  const ncIn = nc ? nc.day - today : 0;

  return (
    <section className="screen" aria-label="Today">
      <div className="line" style={{ gap: 10 }}>
        <div className="daybar">
          <button type="button" className="icon-btn" onClick={() => hub.setDay(day - 1)} disabled={day <= 1} aria-label="Previous day"><Icon name="left" /></button>
          <span style={{ fontWeight: 700, fontSize: 13, padding: '0 6px', whiteSpace: 'nowrap' }}>Day {day} of {plan.days} · {plan.fmtLong(day)}</span>
          <button type="button" className="icon-btn" onClick={() => hub.setDay(day + 1)} disabled={day >= plan.days} aria-label="Next day"><Icon name="right" /></button>
        </div>
        <span className="pill warm" style={{ fontSize: 12, padding: '4px 11px' }}>{plan.label(ph)}</span>
        {startsIn > 0 && <span className="pill sage" style={{ fontSize: 12, padding: '4px 11px' }}>Plan starts in {startsIn} day{startsIn === 1 ? '' : 's'}</span>}
        {day !== today && <button type="button" className="btn-link" onClick={() => hub.setDay(today)}>Back to today</button>}
      </div>

      {plan.isRestDay(day) && race && (
        <div className="hero rest">
          <div className="blob" style={{ right: -80, top: -80, width: 280, height: 280, background: 'var(--color-accent-2-300)' }} />
          <span className="kicker" style={{ color: 'inherit' }}>Day {day} · Rest</span>
          <h1>Rest day</h1>
          <p>Tomorrow is the {race.event ?? 'race'}. No learning and no building today. Lay out your kit, eat well and sleep early.</p>
          <div className="line" style={{ gap: 10 }}>
            <div className="stat"><b>{fmtH(hub.hoursTotal)}</b><span className="small muted">logged so far</span></div>
            <div className="stat"><b>{hub.cpDone}/{data.checkpoints.length}</b><span className="small muted">checkpoints</span></div>
          </div>
          <span style={{ fontSize: 13 }}>The plan picks up on day {race.end + 1} with light revision.</span>
        </div>
      )}

      {plan.isRaceDay(day) && race && (
        <div className="hero race">
          <div className="blob" style={{ right: -60, bottom: -120, width: 360, height: 360, background: 'var(--color-accent-600)' }} />
          <div className="blob" style={{ right: 120, top: -40, width: 120, height: 120, background: 'var(--color-accent-400)' }} />
          <span className="kicker" style={{ color: 'inherit' }}>Day {day} · {plan.fmtFull(day)}</span>
          <h1>Race day</h1>
          <p style={{ fontSize: 17 }}>{race.event ?? 'Race day'}. The plan is on hold today. Run your race.</p>
          <div className="line" style={{ gap: 10 }}>
            <div className="stat"><b>{fmtH(hub.hoursTotal)}</b><span className="small">logged in {race.start - 1} days</span></div>
            <div className="stat"><b>{hub.streak}</b><span className="small">day streak</span></div>
            <div className="stat"><b>{plan.days - day}</b><span className="small">days left after today</span></div>
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="cols" style={{ gap: 20 }}>
          <div className="col-main">
            <div>
              <h1 className="h1">{heading}</h1>
              <p className="lede">{ph.title} · {fmtMin(planned)} planned · {done} of {tasks.length} done</p>
            </div>
            <Bar pct={(done / tasks.length) * 100} className="thick" />
            {tasks.map((t) => {
              const isDone = hub.isOn('task', t.id);
              const tr = TRACK[t.kind];
              return (
                <div key={t.id} className={`task ${isDone ? 'is-done' : ''}`}>
                  <Check size="lg" done={isDone} onClick={() => hub.toggle('task', t.id)} label={`Mark "${t.title}" done`} />
                  <div className="grow stack" style={{ gap: 3 }}>
                    <div className="line"><span className={`pill ${tr.pill}`}>{tr.label}</span><span className="muted small">{fmtMin(t.min)}</span></div>
                    {t.url
                      ? <a className="task-title task-link" href={t.url} target="_blank" rel="noopener">{t.title}<Icon name="right" size={13} /></a>
                      : <div className="task-title">{t.title}</div>}
                    {t.sub && <div className="muted pretty" style={{ fontSize: 13 }}>{t.sub}</div>}
                    {t.kind === 'build' && hasBuildDetails && (
                      <>
                        <button type="button" className="btn-link" style={{ alignSelf: 'flex-start', padding: '4px 0' }} aria-expanded={showBuild} onClick={() => setShowBuild(!showBuild)}>
                          {showBuild ? 'Hide build details' : 'Show build details'}
                        </button>
                        {showBuild && <BuildDetails hub={hub} week={ph} />}
                      </>
                    )}
                  </div>
                  <button type="button" className="btn-line" style={{ flex: 'none' }} onClick={() => hub.startFocus(t)}><PlayIcon />Focus</button>
                </div>
              );
            })}
            <div className="panel sm" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{day === today ? "Today's capture" : `Day ${day} capture`}</span>
              <NoteBox
                key={day}
                className="capture"
                label="Daily capture"
                placeholder="What did you learn? What broke? What's next?"
                value={(hub.items[itemKey('note', String(day))] as string) ?? ''}
                onFocus={hub.gateFocus}
                onSave={(text) => hub.write('note', String(day), text.trim() ? text : undefined, false)}
              />
              <span className="muted small">Saved to the daily log automatically.</span>
            </div>
          </div>
          <aside className="col-side">
            <div className="panel sm">
              <div className="between"><span className="heading" style={{ fontSize: 18 }}>Log time</span><span className="muted small">{fmtH(hub.hoursTotal)} / {totalTarget} h</span></div>
              <HoursRows hub={hub} quickAdd />
            </div>
            <div className="panel sm" style={{ gap: 8 }}>
              <span className="heading" style={{ fontSize: 18 }}>This week</span>
              <div className="stack" style={{ fontSize: 13 }}>
                <div><span style={{ fontWeight: 700, color: 'var(--color-accent-700)' }}>Learn · </span>{ph.learn}</div>
                <div><span style={{ fontWeight: 700, color: 'var(--color-accent-2-700)' }}>Build · </span>{ph.build}</div>
                <div><span style={{ fontWeight: 700, color: 'var(--color-neutral-700)' }}>Interview · </span>{ph.interview}</div>
              </div>
            </div>
            {weekRes.length > 0 && (
              <div className="panel sm" style={{ gap: 6 }}>
                <div className="between"><span className="heading" style={{ fontSize: 18 }}>Resources this week</span><span className="muted small">{weekRes.filter((r) => hub.isOn('resource', r.id)).length}/{weekRes.length}</span></div>
                {weekRes.map((r) => (
                  <div key={r.id} className="tile" style={{ padding: '7px 10px' }}>
                    <Check size="sm" done={hub.isOn('resource', r.id)} onClick={() => hub.toggle('resource', r.id)} label={`Mark "${r.title}" done`} />
                    {r.url
                      ? <a className="grow" href={r.url} target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</a>
                      : <span className="grow" style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</span>}
                    <span className={`pill ${PRIORITY[r.priority].pill}`}>{PRIORITY[r.priority].label}</span>
                  </div>
                ))}
                <button type="button" className="btn-link" style={{ alignSelf: 'flex-start' }} onClick={() => { hub.setResFilter({ q: '', week: ph.id, cat: 'all', prio: 'all' }); hub.go('resources'); }}>Open in library</button>
              </div>
            )}
            {nc && (
              <button type="button" className="cp-next" onClick={() => hub.go('checkpoints')}>
                <span className="kicker" style={{ color: 'var(--color-accent-800)' }}>Next checkpoint · {ncIn === 0 ? 'today' : `in ${ncIn} day${ncIn === 1 ? '' : 's'}`}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Day {nc.day}: {nc.title}</span>
              </button>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
