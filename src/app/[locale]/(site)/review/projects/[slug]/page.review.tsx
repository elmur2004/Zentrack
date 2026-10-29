import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { resolveLocale } from '@/lib/page';
import { reviewProject, reviewProjects } from '@/lib/review/data';
import { ProjectDetail } from '@/components/projects/ProjectDetail';

export const metadata: Metadata = { title: 'Private review — project', robots: { index: false, follow: false } };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => reviewProjects().map((p) => ({ locale, slug: p.slug })));
}

export default async function ReviewProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const project = reviewProject(slug);
  if (!project) notFound();
  return (
    <ProjectDetail project={project} locale={locale} basePath="review/projects" banner={getMessages(locale).review.recordBanner} />
  );
}
