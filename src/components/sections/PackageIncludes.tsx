import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { pageHref } from '@/i18n/routes';
import { ButtonLink, Eyebrow } from '@/components/ui/Button';
import { TechIllustration, type IllustrationKind } from '@/components/motion/TechIllustration';

const KINDS: IllustrationKind[] = ['model', 'drawing', 'register'];

/**
 * H06 fallback when no project record is cleared for publication:
 * a capability illustration (not a fictional case study).
 */
export function PackageIncludes({ locale, showCta = true }: { locale: Locale; showCta?: boolean }) {
  const t = getMessages(locale).home.package;
  return (
    <section className="section section--paper-2 package" aria-labelledby="package-title">
      <div className="container">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 id="package-title" className="h2">
              {t.title}
            </h2>
          </div>
          <div className="section-head__aside">
            <p className="lead muted">{t.intro}</p>
          </div>
        </div>
        <ol className="package__grid">
          {t.items.map((item, i) => (
            <li key={item.title} className="package-card" data-reveal>
              <div className="package-card__visual">
                <TechIllustration kind={KINDS[i] ?? 'model'} />
                <span className="package-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="h3">{item.title}</h3>
              <p className="muted">{item.text}</p>
            </li>
          ))}
        </ol>
        <div className="package__foot">
          <p className="small muted">{t.note}</p>
          {showCta ? (
            <ButtonLink href={pageHref(locale, 'projects')} variant="text" arrow>
              {t.cta}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}
