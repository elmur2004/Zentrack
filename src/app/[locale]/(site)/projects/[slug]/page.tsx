import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { resolveLocale } from '@/lib/page';
import { getPublicProject, publicProjects } from '@/content/public';
import { ProjectDetail } from '@/components/projects/ProjectDetail';

/** Only approved public records are generated; any other slug (including withheld records) is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => publicProjects.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/projects/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getPublicProject(slug);
  if (!isLocale(locale) || !project) return {};
  return pageMetadata({
    locale,
    path: `projects/${slug}`,
    title: project.title[locale],
    description: project.summary?.[locale] ?? project.attributionLabel[locale],
  });
}

export default async function ProjectPage({ params }: PageProps<'/[locale]/projects/[slug]'>) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const project = getPublicProject(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} locale={locale} />;
}
