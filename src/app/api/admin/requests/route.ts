import { LIST_VIEWS, type ListView } from '@/lib/admin/codes';
import { normalizeQuery } from '@/lib/admin/query';
import { readLimited } from '@/lib/server/http';
import { getDb } from '@/server/db/client';
import { listRequests, matchingRequestIds } from '@/server/admin/requests';
import { getSettings } from '@/server/admin/settings';
import { noStoreJson, withAdminActor } from '@/server/http/admin-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Inbox query. POST so free-text search (names, emails) never appears in a URL or access log.
 * in:  { view, query, idsOnly? }   out: { rows, total, page, pageSize, pageCount } | { ids, truncated }
 */
export async function POST(request: Request) {
  return withAdminActor(
    request,
    async (actor) => {
      const raw = await readLimited(request, 16 * 1024);
      if (!raw) return noStoreJson({ code: 'validation' }, 413);
      let body: { view?: string; query?: Record<string, unknown>; idsOnly?: boolean };
      try {
        body = JSON.parse(new TextDecoder().decode(raw));
      } catch {
        return noStoreJson({ code: 'validation' }, 400);
      }
      const view: ListView = (LIST_VIEWS as readonly string[]).includes(String(body.view)) ? (body.view as ListView) : 'inbox';
      const query = normalizeQuery(view, body.query ?? {});
      const db = await getDb();
      const { timezone } = await getSettings(db);
      if (body.idsOnly) return noStoreJson(await matchingRequestIds(db, actor, query, timezone, 1000));
      return noStoreJson(await listRequests(db, actor, query, timezone));
    },
    { mutate: true },
  );
}
