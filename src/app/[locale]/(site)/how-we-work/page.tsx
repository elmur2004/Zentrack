import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageHref } from '@/i18n/routes';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { engagements, stages } from '@/content/public/track';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { Eyebrow } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/icons';
import { ZentracTrack } from '@/components/motion/ZentracTrack';
import { TechIllustration, TRACK_VISUALS } from '@/components/motion/TechIllustration';

export async function generateMetadata({ params }: PageProps<'/[locale]/how-we-work'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).howWeWorkPage.meta;
  return pageMetadata({ locale, path: 'how-we-work', title: t.title, description: t.description });
}

export default async function HowWeWorkPage({ params }: PageProps<'/[locale]/how-we-work'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const p = t.howWeWorkPage;

  return (
    <>
      <PageHero
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        crumbs={crumbs(locale, ['howWeWork', t.nav.howWeWork])}
        crumbLabel={t.common.breadcrumb}
      />

      <section className="section section--white track-section" aria-labelledby="track-title">
        <div className="container">
          <div className="section-head section-head--split" data-reveal>
            <div>
              <Eyebrow>{t.home.track.eyebrow}</Eyebrow>
              <h2 id="track-title" className="h2">
                {t.home.track.title}
              </h2>
            </div>
            <div className="section-head__aside">
              <p className="lead muted">{t.home.track.intro}</p>
            </div>
          </div>
          <ZentracTrack
            idPrefix="stage"
            visuals={TRACK_VISUALS.map((kind) => (
              <TechIllustration key={kind} kind={kind} />
            ))}
            stages={stages.map((s) => ({
              id: s.id,
              number: s.number,
              title: s.title[locale],
              text: s.text[locale],
              input: s.input[locale],
              output: s.output[locale],
            }))}
            labels={{ stagesNav: t.home.track.stagesNav, input: t.home.track.input, output: t.home.track.output }}
          />
        </div>
      </section>

      <section id="engagement" className="section section--paper" aria-labelledby="engagement-title">
        <div className="container">
          <div className="section-head section-head--split" data-reveal>
            <div>
              <Eyebrow>{p.engagement.eyebrow}</Eyebrow>
              <h2 id="engagement-title" className="h2">
                {p.engagement.title}
              </h2>
            </div>
            <div className="section-head__aside">
              <p className="lead muted">{t.home.track.joinTitle}</p>
              <p className="muted">{p.engagement.intro}</p>
            </div>
          </div>
          <ul className="engagement-grid">
            {engagements.map((e, i) => (
              <li key={e.id} className="engagement-card" data-reveal>
                <span className="engagement-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="h3">{e.title[locale]}</h3>
                <p className="muted">{e.text[locale]}</p>
                <Link href={`${pageHref(locale, 'quote')}?scope=${e.id}`} className="text-link engagement-card__link">
                  {p.engagement.cta}
                  <span className="sr-only"> — {e.title[locale]}</span>
                  <ArrowIcon size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactBand locale={locale} />
    </>
  );
}
