import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/messages';
import { countryName } from '@/i18n/format';
import { localePath } from '@/i18n/routes';
import { resolveLocale } from '@/lib/page';
import { draftArticles, internalAssets, registerOnlyGroups, reviewProjects } from '@/lib/review/data';
import { ProjectCard } from '@/components/sections/ProjectCard';
import { ArrowIcon } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Private review', robots: { index: false, follow: false } };

const L = {
  en: {
    title: 'Private review',
    lead: 'Withheld project records, draft articles and conditional modules, rendered with the production templates. Nothing on this page is published.',
    featured: 'Homepage “Selected experience” (H06) as it would appear after approval',
    allProjects: 'All eight project records (filterable index)',
    articles: 'Draft articles',
    register: 'Other register groups (not selected, no country assumed)',
    assets: 'Asset register vs. files actually supplied',
    specialist: 'Conditional module: specialist services (off until confirmed)',
    profile: 'Company profile download',
    profileText: 'No reviewed public PDF has been supplied. The existing profile (F2) contains unresolved metrics, project names and contact placeholders, so the download stays hidden.',
    present: 'Present', missing: 'Not supplied', state: 'State',
  },
  ar: {
    title: 'مراجعة خاصة',
    lead: 'سجلات المشروعات المحجوبة ومسودات المقالات والوحدات المشروطة، معروضة بقوالب الموقع الفعلية. لا يُنشر شيء من هذه الصفحة.',
    featured: 'قسم «خبرات مختارة» في الصفحة الرئيسية كما سيظهر بعد الموافقة',
    allProjects: 'سجلات المشروعات الثمانية (فهرس قابل للتصفية)',
    articles: 'مسودات المقالات',
    register: 'مجموعات أخرى في السجل (غير مختارة، ودون افتراض الدولة)',
    assets: 'سجل الأصول مقارنة بالملفات المسلَّمة فعليًا',
    specialist: 'وحدة مشروطة: الخدمات المتخصصة (معطلة حتى التأكيد)',
    profile: 'تحميل الملف التعريفي',
    profileText: 'لم يُسلَّم ملف PDF عام بعد مراجعته. يحتوي الملف الحالي (F2) على أرقام وأسماء مشروعات وبيانات تواصل غير محسومة، لذا يبقى التحميل مخفيًا.',
    present: 'متاح', missing: 'غير مسلَّم', state: 'الحالة',
  },
} as const;

export default async function ReviewIndex({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const l = L[locale];
  const projects = reviewProjects();
  const featured = projects.filter((p) => p.featured).slice(0, 3);

  return (
    <>
      <section className="page-hero on-dark page-hero--compact">
        <div className="page-hero__grid" aria-hidden="true" />
        <div className="container page-hero__inner">
          <div className="page-hero__copy">
            <p className="record-banner" role="note">{t.review.banner}</p>
            <h1 className="h1 page-hero__title">{l.title}</h1>
            <p className="lead page-hero__lead">{l.lead}</p>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <h2 className="h2 section-head">{l.featured}</h2>
          <p className="muted section-head">{t.projectsPage.attribution}</p>
          <div className="project-feature-grid">
            {featured.map((p, i) => (
              <ProjectCard key={p.id} project={p} locale={locale} labels={t.projectsPage.card} basePath="review/projects" variant={i === 0 ? 'wide' : 'default'} />
            ))}
          </div>
          <p className="section-head" style={{ marginBlockStart: 32 }}>
            <Link className="text-link" href={localePath(locale, 'review/projects')}>
              {l.allProjects}
              <ArrowIcon size={16} />
            </Link>
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <h2 className="h2 section-head">{l.articles}</h2>
          <ul className="other-services">
            {draftArticles.map((a) => (
              <li key={a.id}>
                <Link href={localePath(locale, `review/blog/${a.slug}`)} className="other-services__link">
                  <span className="other-services__num">{a.id}</span>
                  <span>{a.title[locale]}</span>
                  <ArrowIcon size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <h2 className="h2 section-head">{l.register}</h2>
          <div className="register__scroll">
            <table className="register__table">
              <thead>
                <tr><th scope="col">ID</th><th scope="col">{t.projectDetail.package}</th><th scope="col">{t.projectDetail.scopeTitle}</th><th scope="col">{t.projectDetail.country}</th></tr>
              </thead>
              <tbody>
                {registerOnlyGroups().map((r) => (
                  <tr key={r.id}>
                    <td><bdi dir="ltr">{r.id}</bdi></td>
                    <td>{r.title[locale]}</td>
                    <td>{r.summary[locale]}</td>
                    <td>{r.countryCode ? countryName(locale, r.countryCode) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <h2 className="h2 section-head">{l.assets}</h2>
          <div className="register__scroll">
            <table className="register__table">
              <thead>
                <tr><th scope="col">ID</th><th scope="col">Project</th><th scope="col">Register</th><th scope="col">File</th><th scope="col">{l.state}</th></tr>
              </thead>
              <tbody>
                {internalAssets.map((a) => (
                  <tr key={a.id}>
                    <td><bdi dir="ltr">{a.id}</bdi></td>
                    <td><bdi dir="ltr">{a.projectId}</bdi></td>
                    <td><bdi dir="ltr">{a.registeredSize ? `${a.registeredSize.width}×${a.registeredSize.height}` : '—'}</bdi></td>
                    <td>{a.actualFile ? <>{l.present} · <bdi dir="ltr">{a.actualSize?.width}×{a.actualSize?.height}</bdi></> : l.missing}</td>
                    <td>{a.publication.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container split">
          <div>
            <h2 className="h3">{l.specialist}</h2>
            <div className="scope-note">
              <p className="eyebrow">{t.servicesPage.specialist.eyebrow}</p>
              <h3 className="h3">{t.servicesPage.specialist.title}</h3>
              <p className="muted">{t.servicesPage.specialist.text}</p>
            </div>
          </div>
          <div>
            <h2 className="h3">{l.profile}</h2>
            <p className="scope-note">{l.profileText}</p>
          </div>
        </div>
      </section>
    </>
  );
}
