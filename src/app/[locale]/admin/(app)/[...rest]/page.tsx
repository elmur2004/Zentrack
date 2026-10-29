import { notFound } from 'next/navigation';
import { adminLocale } from '@/server/admin/page-context';
import { requireActor } from '@/server/auth/session';

/** Unknown dashboard paths: sign-in first (no route probing), then the dashboard 404. */
export default async function AdminCatchAll({ params }: PageProps<'/[locale]/admin/[...rest]'>) {
  await requireActor(await adminLocale(params));
  notFound();
}
