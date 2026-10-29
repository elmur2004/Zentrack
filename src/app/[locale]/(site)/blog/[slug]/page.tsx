import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { resolveLocale } from '@/lib/page';
import { getPublicArticle, publicArticles } from '@/content/public';
import { ArticleView } from '@/components/articles/ArticleView';

/** Only reviewed, published articles are generated; drafts and unknown slugs return 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => publicArticles.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/blog/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getPublicArticle(slug);
  if (!isLocale(locale) || !article) return {};
  return pageMetadata({
    locale,
    path: `blog/${slug}`,
    title: article.title[locale],
    description: article.excerpt[locale],
    type: 'article',
  });
}

export default async function ArticlePage({ params }: PageProps<'/[locale]/blog/[slug]'>) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = getPublicArticle(slug);
  if (!article) notFound();
  return <ArticleView article={article} locale={locale} />;
}
