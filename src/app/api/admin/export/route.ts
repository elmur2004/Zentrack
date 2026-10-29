import { LIST_VIEWS, type ListView } from '@/lib/admin/codes';
import { normalizeQuery } from '@/lib/admin/query';
import { readLimited } from '@/lib/server/http';
import { getDb } from '@/server/db/client';
import { buildExport, previewExport, type ExportInput } from '@/server/admin/exports';
import { getSettings } from '@/server/admin/settings';
import { noStoreJson, withAdminActor } from '@/server/http/admin-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Permissioned CSV export. POST only (scope and search stay out of URLs); generated on demand,
 * returned as an attachment with no-store caching; never written to public storage.
 * in: { preview?, scope: 'selected'|'filtered', ids?, view?, query?, include: [], language }
 */
export async function POST(request: Request) {
  return withAdminActor(
    request,
    async (actor) => {
      const raw = await readLimited(request, 256 * 1024);
      if (!raw) return noStoreJson({ code: 'validation' }, 413);
      let body: { preview?: boolean; scope?: string; ids?: unknown; view?: string; query?: Record<string, unknown>; include?: unknown; language?: string };
      try {
        body = JSON.parse(new TextDecoder().decode(raw));
      } catch {
        return noStoreJson({ code: 'validation' }, 400);
      }
      const view: ListView = (LIST_VIEWS as readonly string[]).includes(String(body.view)) ? (body.view as ListView) : 'inbox';
      const input: ExportInput = {
        scope: body.scope === 'selected' ? 'selected' : 'filtered',
        ids: Array.isArray(body.ids) ? body.ids.map(String) : [],
        query: normalizeQuery(view, body.query ?? {}),
        include: Array.isArray(body.include) ? body.include.map(String) : [],
        language: body.language === 'ar' ? 'ar' : 'en',
      };
      const db = await getDb();
      const { timezone } = await getSettings(db);
      if (body.preview) return noStoreJson(await previewExport(db, actor, input, timezone));
      const out = await buildExport(db, actor, input, timezone);
      return new Response(new Uint8Array(out.csv), {
        status: 200,
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="${out.filename}"`,
          'cache-control': 'private, no-store',
          'x-content-type-options': 'nosniff',
          'x-export-count': String(out.count),
        },
      });
    },
    { mutate: true },
  );
}
