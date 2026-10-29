import '@/styles/globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found · Zentrac',
  description: 'The page you are looking for does not exist.',
};

/**
 * Backstop 404 for URLs outside /en and /ar that the proxy did not redirect.
 * Bilingual because no locale can be inferred here.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main className="status-page on-dark" id="main">
          <div className="container status-page__inner">
            <p className="eyebrow eyebrow--on-dark">Error 404</p>
            <h1 className="h1">Page not found</h1>
            <p className="lead status-page__text">The page you are looking for does not exist or is not available.</p>
            <div lang="ar" dir="rtl" className="status-page__alt">
              <p className="h3">الصفحة غير موجودة</p>
              <p>الصفحة التي تبحث عنها غير موجودة أو غير متاحة.</p>
            </div>
            <ul className="status-page__links">
              <li>
                <Link className="status-page__link" href="/en">
                  English homepage
                </Link>
              </li>
              <li>
                <Link className="status-page__link" href="/ar" lang="ar" hrefLang="ar">
                  الصفحة الرئيسية بالعربية
                </Link>
              </li>
            </ul>
          </div>
        </main>
      </body>
    </html>
  );
}
