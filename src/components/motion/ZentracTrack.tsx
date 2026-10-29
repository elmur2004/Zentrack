import type { ReactNode } from 'react';
import { TrackController } from './TrackController';

export interface TrackStage {
  id: string;
  number: string;
  title: string;
  text: string;
  input: string;
  output: string;
}

/**
 * H07 / M08 The Zentrac Track — server-rendered markup with a behaviour-only controller.
 * Desktop with motion: CSS-sticky visual beside six normal-flow stages; the orange line scrubs
 * with page scroll and the matching station activates (no pinning, no wheel capture).
 * Mobile and reduced motion: static vertical timeline. Without JavaScript or when printed,
 * the full process remains readable; stations are real anchors to each stage.
 */
export function ZentracTrack({
  stages,
  visuals,
  labels,
  idPrefix = 'stage',
}: {
  stages: TrackStage[];
  visuals: ReactNode[];
  labels: { stagesNav: string; input: string; output: string };
  idPrefix?: string;
}) {
  const rootId = `${idPrefix}-track`;
  return (
    <div className="track" id={rootId}>
      <ol className="track__stages">
        {stages.map((s, i) => (
          <li key={s.id} id={`${idPrefix}-${s.id}`} className="track__stage" data-index={i} data-active={i === 0 || undefined} data-reveal>
            <span className="track__marker" aria-hidden="true">
              {s.number}
            </span>
            <div className="track__stage-body">
              <h3 className="h3 track__title">
                <span className="sr-only">{s.number} </span>
                {s.title}
              </h3>
              <p className="track__text">{s.text}</p>
              <dl className="track__io">
                <div>
                  <dt>{labels.input}</dt>
                  <dd>{s.input}</dd>
                </div>
                <div>
                  <dt>{labels.output}</dt>
                  <dd>{s.output}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>

      <div className="track__visual">
        <div className="track__sticky">
          <nav aria-label={labels.stagesNav} className="track__rail">
            <span className="track__line" aria-hidden="true">
              <span className="track__progress" />
            </span>
            <ol>
              {stages.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${idPrefix}-${s.id}`} className="track__station" data-index={i} data-active={i === 0 || undefined}>
                    <span className="track__node" aria-hidden="true" />
                    <span className="track__station-num" aria-hidden="true">
                      {s.number}
                    </span>
                    <span className="track__station-title">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="track__scene" aria-hidden="true">
            {stages.map((s, i) => (
              <div key={s.id} className="track__slide" data-index={i} data-active={i === 0 || undefined}>
                {visuals[i]}
                <p className="track__now">
                  <span className="track__now-num">{s.number}</span>
                  <span className="track__now-total">/ {String(stages.length).padStart(2, '0')}</span>
                  <span>{s.title}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TrackController rootId={rootId} count={stages.length} />
    </div>
  );
}
