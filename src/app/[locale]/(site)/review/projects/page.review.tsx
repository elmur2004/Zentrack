import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { resolveLocale } from '@/lib/page';
import { reviewProjects } from '@/lib/review/data';
import { ProjectsIndex } from '@/components/projects/ProjectsIndex';

export const metadata: Metadata = { title: 'Private review — projects', robots: { index: false, follow: false } };

export default async function ReviewProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  return (
    <ProjectsIndex
      locale={locale}
      projects={reviewProjects()}
      basePath="review/projects"
      banner={getMessages(locale).review.banner}
    />
  );
}
