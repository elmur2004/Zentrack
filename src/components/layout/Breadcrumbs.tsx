import Link from 'next/link';
import { CrumbIcon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export interface Crumb {
  name: string;
  href: string;
}

/** Breadcrumb trail. Progression follows reading direction; separators mirror in RTL. */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <>
      <nav aria-label={label} className="breadcrumbs">
        <ol>
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.href}>
                {last ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <>
                    <Link href={item.href}>{item.name}</Link>
                    <CrumbIcon className="breadcrumbs__sep" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
