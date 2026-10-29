import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { formatDate, plural } from '@/i18n/format';
import { localePath, pageHref, serviceHref } from '@/i18n/routes';
import { getService } from '@/content/public/services';
import type { ArticleBlock, PublicArticle } from '@/lib/content/types';
import { crumbs } from '@/lib/page';
import { absoluteUrl } from '@/lib/site';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ContactBand } from '@/components/sections/ContactBand';
import { ArrowIcon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/JsonLd';

/** Renders structured blocks only — never raw HTML from content. Latin tokens are isolated. */
function TextWithTokens({ text }: { text: string }) {
  // `backticks` mark identifiers/code that must stay LTR inside Arabic paragraphs.
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <bdi key={i} dir="ltr" className="token">
            {part.slice(1, -1)}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="h2">{block.text}</h2>;
    case 'h3':
      return <h3 className="h3">{block.text}</h3>;
    case 'ul':
      return (
        <ul>
          {block.items?.map((item) => (
            <li key={item}>
              <TextWithTokens text={item} />
            </li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="table-scroll" role="region" aria-label={block.caption} tabIndex={0}>
          <table>
            {block.caption ? <caption>{block.caption}</caption> : null}
            <thead>
              <tr>
                {block.rows?.[0]?.map((cell) => (
                  <th key={cell} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.slice(1).map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <TextWithTokens text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'note':
      return (
        <aside className="scope-note">
          <p>
            <TextWithTokens text={block.text ?? ''} />
          </p>
        </aside>
      );
    default:
      return (
        <p>
          <TextWithTokens text={block.text ?? ''} />
        </p>
      );
  }
}

export function ArticleView({
  article,
  locale,
  basePath = 'blog',
  banner,
}: {
  article: PublicArticle;
  locale: Locale;
  basePath?: string;
  banner?: string;
}) {
  const t = getMessages(locale);
  const a = t.article;
  const href = localePath(locale, `${basePath}/${article.slug}`);

  return (
    <>
      <section className="page-hero on-dark page-hero--article">
        <div className="page-hero__grid" aria-hidden="true" />
        <div className="container page-hero__inner">
          <div className="page-hero__copy reading">
            {banner ? (
              <p className="record-banner" role="note">
                {banner}
              </p>
            ) : null}
            <Breadcrumbs
              label={t.common.breadcrumb}
              items={crumbs(locale, { name: t.nav.insights, href: localePath(locale, basePath) }, { name: article.title[locale], href })}
            />
            <h1 className="h1 page-hero__title article__title">{article.title[locale]}</h1>
            <p className="lead page-hero__lead">{article.excerpt[locale]}</p>
            <p className="article__meta">
              {article.publishedAt ? (
                <span>
                  {a.published}: <time dateTime={article.publishedAt}>{formatDate(locale, article.publishedAt)}</time>
                </span>
              ) : null}
              {article.updatedAt ? (
                <span>
                  {a.updated}: <time dateTime={article.updatedAt}>{formatDate(locale, article.updatedAt)}</time>
                </span>
              ) : null}
              <span>{plural(locale, article.readingMinutes[locale], a.readingTime)}</span>
            </p>
          </div>
        </div>
      </section>

      <article className="section section--white">
        <div className="container">
          <div className="prose article__body">
            {article.body[locale].map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {article.references.length ? (
            <section className="article__refs reading" aria-labelledby="refs-title">
              <h2 id="refs-title" className="h3">
                {a.references}
              </h2>
              <ol>
                {article.references.map((r) => (
                  <li key={r.title}>
                    {r.url ? (
                      <a href={r.url} rel="noopener noreferrer" target="_blank" lang="en">
                        {r.title} <span className="sr-only">{t.common.opensInNewTab}</span>
                      </a>
                    ) : (
                      <span lang="en">{r.title}</span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {article.relatedServiceIds.length ? (
            <section className="article__related reading" aria-labelledby="related-services-title">
              <h2 id="related-services-title" className="h3">
                {a.relatedServices}
              </h2>
              <ul className="service-links">
                {article.relatedServiceIds.map((id) => {
                  const s = getService(id);
                  return s ? (
                    <li key={id}>
                      <Link href={serviceHref(locale, s.id)} className="text-link">
                        {s.name[locale]}
                        <ArrowIcon size={16} />
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          ) : null}

          <Link href={pageHref(locale, 'blog')} className="back-link back-link--light">
            <ArrowIcon size={16} className="back-link__icon" />
            {a.back}
          </Link>
        </div>
      </article>

      <ContactBand locale={locale} title={a.ctaTitle} text={a.ctaText} />
      {!banner && article.publishedAt ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title[locale],
            description: article.excerpt[locale],
            inLanguage: locale,
            datePublished: article.publishedAt,
            ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
            ...(article.author ? { author: { '@type': 'Person', name: article.author[locale] } } : {}),
            publisher: { '@type': 'Organization', name: 'Zentrac' },
            url: absoluteUrl(href),
          }}
        />
      ) : null}
    </>
  );
}
