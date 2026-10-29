import { getDb } from '@/server/db/client';
import { isDomainError } from '@/server/admin/errors';
import { contentDisposition, resolveFileLink } from '@/server/admin/files';
import { actorFromHeaders, adminAvailable } from '@/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function plain(status: number, text: string) {
  return new Response(text, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' },
  });
}

/**
 * Private file delivery. The short-lived token is bound to the user and session that requested
 * it; the live session, membership, permission and scan state are re-checked here every time,
 * so sign-out or revocation stops a link immediately. Files are never rendered as HTML.
 */
export async function GET(request: Request, ctx: RouteContext<'/api/admin/files/[id]'>) {
  if (!adminAvailable()) return plain(503, 'Unavailable');
  const { id } = await ctx.params;
  const token = new URL(request.url).searchParams.get('token') ?? '';
  try {
    const actor = await actorFromHeaders(request.headers);
    const db = await getDb();
    const file = await resolveFileLink(db, actor, id, token);
    return new Response(new Uint8Array(file.bytes), {
      status: 200,
      headers: {
        'content-type': file.mimeType,
        'content-length': String(file.bytes.length),
        'content-disposition': contentDisposition(file.name, file.inline),
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
        'cross-origin-resource-policy': 'same-origin',
        'x-robots-tag': 'noindex, nofollow',
        'referrer-policy': 'no-referrer',
      },
    });
  } catch (e) {
    if (isDomainError(e)) {
      if (e.code === 'unauthenticated') return plain(401, 'Sign in again to download this file.');
      if (e.code === 'link_expired') return plain(410, 'This file link has expired. Request a new link from the dashboard.');
      if (e.code === 'file_unavailable') return plain(409, 'This file is not available for download.');
      if (e.code === 'forbidden') return plain(403, 'Not permitted.');
      return plain(404, 'Not found.');
    }
    console.error('[admin] file route error', e instanceof Error ? e.name : typeof e);
    return plain(503, 'Unavailable');
  }
}
