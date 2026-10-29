/** Server part of the three list screens (inbox, my queue, archived/spam). */
import type { ListView } from '@/lib/admin/codes';
import { labelMaps } from '@/lib/admin/labels';
import { queryFromSearchParams } from '@/lib/admin/query';
import { Inbox, type InboxData } from '@/components/admin/Inbox';
import { can } from './policy';
import { listRequests } from './requests';
import { listAssignableMembers } from './team';
import type { adminPageContext } from './page-context';

type Ctx = Awaited<ReturnType<typeof adminPageContext>>;

export async function InboxSection({ ctx, view, searchParams }: { ctx: Ctx; view: ListView; searchParams: Record<string, string | string[] | undefined> }) {
  const { locale, actor, db, settings } = ctx;
  const query = queryFromSearchParams(view, searchParams);
  const [data, members] = await Promise.all([listRequests(db, actor, query, settings.timezone), listAssignableMembers(db, actor)]);
  const labels = labelMaps(locale);
  return (
    <Inbox
      key={view}
      locale={locale}
      view={view}
      initialQuery={{ ...query, page: data.page }}
      initialData={data as unknown as InboxData}
      members={members}
      can={{ assign: can(actor, 'request.assign'), archive: can(actor, 'request.archive'), spam: can(actor, 'request.spam'), export: can(actor, 'request.export') }}
      labels={{ services: labels.services, countries: labels.countries }}
      timezone={settings.timezone}
      nowIso={new Date().toISOString()}
    />
  );
}
