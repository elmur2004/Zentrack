import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { formatDate } from '@/i18n/format';
import { articleHref, pageHref } from '@/i18n/routes';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { publicArticles } from '@/content/public';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { ButtonLink } from '@/components/ui/Button';

export async function generateMetadata({ params }: PageProps<'/[locale]/blog'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).blogPage.meta;
  // OD-29: kept out of search results until the first article is published.
  return pageMetadata({ locale, path: 'blog', title: t.title, description: t.description, noindex: publicArticles.length ? undefined : 'follow' });
}

export default async function BlogPage({ params }: PageProps<'/[locale]/blog'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const b = t.blogPage;

  return (
    <>
      <PageHero
        eyebrow={b.hero.eyebrow}
        title={b.hero.title}
        lead={b.hero.lead}
        crumbs={crumbs(locale, ['blog', t.nav.insights])}
        crumbLabel={t.common.breadcrumb}
      />
      <section className="section section--white" aria-labelledby="articles-title">
        <div className="container">
          {publicArticles.length ? (
            <>
              <h2 id="articles-title" className="sr-only">
                {b.hero.title}
              </h2>
              <ul className="article-grid">
                {publicArticles.map((a) => (
                  <li key={a.id} className="article-card">
                    <time dateTime={a.publishedAt}>{formatDate(locale, a.publishedAt)}</time>
                    <h3 className="h3">
                      <Link href={articleHref(locale, a.slug)}>{a.title[locale]}</Link>
                    </h3>
                    <p className="muted">{a.excerpt[locale]}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="empty-panel">
              <span className="empty-panel__mark" aria-hidden="true" />
              <h2 id="articles-title" className="h2">
                {b.empty.title}
              </h2>
              <p className="lead muted">{b.empty.text}</p>
              <div className="empty-panel__actions">
                <ButtonLink href={pageHref(locale, 'services')} variant="primary" arrow>
                  {b.empty.ctaServices}
                </ButtonLink>
                <ButtonLink href={pageHref(locale, 'quote')} variant="ghost-light">
                  {b.empty.ctaContact}
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
      </section>
      <ContactBand locale={locale} />
    </>
  );
}
