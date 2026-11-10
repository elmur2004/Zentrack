import Image from 'next/image';
import type { Locale } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import type { TeamMember, TeamMotif } from '@/content/public/team';
import { Eyebrow } from '@/components/ui/Button';

interface Labels {
  coFounders: string;
  portraitAlt: string;
}

/**
 * Founding team (About page). The founder leads on a dark panel with the logo's diagonal cut on
 * the portrait; co-founders follow as cards. Portraits are cut-outs on a navy drafting panel; a
 * person without a supplied portrait gets a technical drawing of their discipline instead
 * (decorative, never mirrored). All text is real HTML; the section needs no script.
 */
export function FoundingTeam({ founder, coFounders, locale, labels }: { founder: TeamMember; coFounders: TeamMember[]; locale: Locale; labels: Labels }) {
  return (
    <div className="team">
      <article className="team-lead on-dark" aria-labelledby={`team-${founder.id}`} data-reveal>
        <div className="team-lead__media">
          <Media member={founder} locale={locale} labels={labels} sizes="(min-width: 64rem) 560px, 100vw" />
        </div>
        <div className="team-lead__body">
          <Eyebrow>{founder.label[locale]}</Eyebrow>
          <h3 id={`team-${founder.id}`} className="team-lead__name">
            {founder.name[locale]}
          </h3>
          <p className="team-lead__discipline">{founder.discipline[locale]}</p>
          <div className="team-lead__bio">
            {founder.bio[locale].map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <Focus items={founder.focus[locale]} />
        </div>
      </article>

      <ul className="team-grid" aria-label={labels.coFounders}>
        {coFounders.map((m) => (
          <li key={m.id} className="team-card" data-reveal>
            <div className="team-card__media">
              <Media member={m} locale={locale} labels={labels} sizes="(min-width: 64rem) 400px, (min-width: 40rem) 50vw, 100vw" />
            </div>
            <div className="team-card__body">
              <Eyebrow>{m.label[locale]}</Eyebrow>
              <h3 id={`team-${m.id}`} className="h3 team-card__name">
                {m.name[locale]}
              </h3>
              <p className="team-card__discipline">{m.discipline[locale]}</p>
              {m.bio[locale].map((p) => (
                <p key={p} className="muted team-card__bio">
                  {p}
                </p>
              ))}
              <Focus items={m.focus[locale]} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Focus({ items }: { items: string[] }) {
  return (
    <ul className="chip-list team__focus">
      {items.map((f) => (
        <li key={f} className="chip">
          {f}
        </li>
      ))}
    </ul>
  );
}

/**
 * Every person stands on the same navy drafting panel. A cut-out portrait sits in front of two
 * slanted bars (the logo's angle); without a portrait, the panel carries a drawing of the discipline.
 */
function Media({ member, locale, labels, sizes }: { member: TeamMember; locale: Locale; labels: Labels; sizes: string }) {
  if (member.photo) {
    return (
      <div className="team__panel team__panel--portrait">
        <span className="team__drawing-grid" />
        <span className="team__bar team__bar--orange" />
        <span className="team__bar team__bar--light" />
        <span className="corner-marks" />
        <Image
          className="team__photo"
          src={member.photo.src}
          alt={fmt(labels.portraitAlt, { name: member.name[locale] })}
          width={member.photo.width}
          height={member.photo.height}
          sizes={sizes}
          style={{ objectPosition: member.photo.focus }}
        />
      </div>
    );
  }
  return (
    <div className="team__panel team__drawing on-dark" aria-hidden="true">
      <span className="team__drawing-grid" />
      {member.motif ? <Motif motif={member.motif} /> : null}
      <span className="corner-marks" />
    </div>
  );
}

/** Line drawings in the site's schematic style. Coordinates are fixed: never mirrored in Arabic. */
function Motif({ motif }: { motif: TeamMotif }) {
  if (motif === 'hydraulics') {
    // Plan of a gravity network above its longitudinal profile.
    return (
      <svg className="team__motif" viewBox="0 0 400 400" focusable="false">
        <g className="team__motif-line">
          <path d="M40 112H360" />
          <path d="M120 112V44M200 112V60M280 112V180M120 44H80M200 60H250" />
        </g>
        <g className="team__motif-node">
          {[60, 120, 200, 280, 340].map((x) => (
            <circle key={x} cx={x} cy={112} r={7} />
          ))}
          <circle cx={120} cy={44} r={6} />
          <circle cx={200} cy={60} r={6} />
          <circle cx={280} cy={180} r={6} />
        </g>
        <path className="team__motif-accent" d="M200 112H280" />
        <path className="team__motif-accent team__motif-arrow" d="M232 102l12 10-12 10" />
        {/* Profile: ground line, pipe falling to the outfall, manholes, datum */}
        <path className="team__motif-line" d="M40 238C90 230 130 252 180 244S280 228 360 246" />
        <g className="team__motif-line">
          <path d="M40 298L360 334M40 310L360 346" />
          <path d="M70 233V318H92V236M170 246V330H192V244M270 238V341H292V238" />
        </g>
        <path className="team__motif-dash" d="M40 376H360" />
        <g className="team__motif-faint">
          {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((x) => (
            <path key={x} d={`M${x} 370V382`} />
          ))}
        </g>
      </svg>
    );
  }
  // Building section on its grid: slabs, columns, a stair and one highlighted room.
  return (
    <svg className="team__motif" viewBox="0 0 400 400" focusable="false">
      <g className="team__motif-dash">
        {[90, 170, 250, 330].map((x) => (
          <path key={x} d={`M${x} 58V344`} />
        ))}
      </g>
      <g className="team__motif-node">
        {[90, 170, 250, 330].map((x) => (
          <circle key={x} cx={x} cy={44} r={10} />
        ))}
      </g>
      <g className="team__motif-line team__motif-slab">
        <path d="M70 300H350M80 230H340M80 160H340M70 90H350" />
      </g>
      <g className="team__motif-line">
        {[90, 170, 250, 330].flatMap((x) =>
          [
            [90, 160],
            [160, 230],
            [230, 300],
          ].map(([y1, y2]) => <path key={`${x}-${y1}`} d={`M${x - 4} ${y1}V${y2}M${x + 4} ${y1}V${y2}`} />),
        )}
        <path d="M262 300h12v-10h12v-10h12v-10h12v-10h12v-10h8M262 230h12v-10h12v-10h12v-10h12v-10h12v-10h8" />
        <path d="M70 90V78H350V90" />
      </g>
      <rect className="team__motif-accent" x={98} y={168} width={64} height={54} />
      <g className="team__motif-faint">
        {[80, 104, 128, 152, 176, 200, 224, 248, 272, 296, 320].map((x) => (
          <path key={x} d={`M${x} 312l18-12`} />
        ))}
        <path d="M90 334H330" />
        {[90, 170, 250, 330].map((x) => (
          <path key={x} d={`M${x - 5} 339l10-10`} />
        ))}
      </g>
    </svg>
  );
}
