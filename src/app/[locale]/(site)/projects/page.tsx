import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { resolveLocale } from '@/lib/page';
import { publicProjects } from '@/content/public';
import { ProjectsIndex } from '@/components/projects/ProjectsIndex';

export async function generateMetadata({ params }: PageProps<'/[locale]/projects'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).projectsPage.meta;
  // OD-29: kept out of search results until the first project is published.
  return pageMetadata({ locale, path: 'projects', title: t.title, description: t.description, noindex: publicProjects.length ? undefined : 'follow' });
}

export default async function ProjectsPage({ params }: PageProps<'/[locale]/projects'>) {
  const locale = await resolveLocale(params);
  return <ProjectsIndex locale={locale} projects={publicProjects} />;
}
