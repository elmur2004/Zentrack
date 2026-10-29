import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveLocale } from '@/lib/page';
import { reviewArticle, reviewArticles } from '@/lib/review/data';
import { ArticleView } from '@/components/articles/ArticleView';

export const metadata: Metadata = { title: 'Private review — draft article', robots: { index: false, follow: false } };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => reviewArticles().map((a) => ({ locale, slug: a.slug })));
}

export default async function ReviewArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = reviewArticle(slug);
  if (!article) notFound();
  return <ArticleView article={article} locale={locale} basePath="review/blog" banner={getMessages(locale).review.banner} />;
}
