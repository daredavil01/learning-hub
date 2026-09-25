import type { Hub, StarValue } from '../App.tsx';
import { itemKey } from '../../lib/store.ts';
import { Icon } from '../ui.tsx';

export default function Stars({ hub }: { hub: Hub }) {
  const { data, items } = hub;
  const own = (id: string) => items[itemKey('star', id)] as StarValue | undefined;
  const written = data.stars.filter((s) => own(s.id)).length;

  return (
    <section className="screen" aria-label="STAR stories">
      <div className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="h1">STAR story bank</h1>
          <p className="lede">Eight stories by day {hub.plan.days}. "I raised faithfulness from X to Y by changing Z" beats any template.</p>
        </div>
        <span className="heading" style={{ fontSize: 22 }}>{written} / {data.stars.length}</span>
      </div>
      <div className="stars">
        {data.stars.map((slot, i) => {
          const story = own(slot.id) ?? slot.sample;
          const isSample = !own(slot.id) && !!slot.sample;
          if (!story) {
            return (
              <div key={slot.id} className="star empty">
                <span className="label">Story {i + 1}</span>
                <span className="star-title" style={{ flex: 1, color: 'var(--color-neutral-800)' }}>{slot.prompt}</span>
                <button type="button" className="btn-accent" style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, padding: '7px 14px' }} onClick={() => hub.editStar(slot.id)}>
                  <Icon name="plus" size={13} />Write story
                </button>
              </div>
            );
          }
          return (
            <div key={slot.id} className="star">
              <div className="line" style={{ gap: 6 }}>
                {isSample && <span className="pill sage">Sample</span>}
                <span className="kicker" style={{ letterSpacing: '.06em' }}>{story.tags || 'Story'}</span>
              </div>
              <span className="star-title">{story.title || slot.prompt}</span>
              <div className="star-body">
                {(['s', 't', 'a', 'r'] as const).map((k) => (
                  <div key={k}><strong>{k.toUpperCase()}</strong> <span className="muted">{story[k]}</span></div>
                ))}
              </div>
              <button type="button" className="btn-line sm" style={{ alignSelf: 'flex-start', fontWeight: 700 }} onClick={() => hub.editStar(slot.id)}>Edit</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
