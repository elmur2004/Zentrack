import { checkFileMeta, detectFileType, LIMITS } from '@/lib/forms/schema';
import { getFormMode, uploadsEnabled } from '@/lib/forms/config';
import { registerUpload } from '@/lib/server/store';
import { clientKey, json, sameOrigin } from '@/lib/server/http';
import { getDb } from '@/server/db/client';
import { isDomainError } from '@/server/admin/errors';
import { newUploadSessionToken, storePublicUpload, UPLOAD_SESSION_COOKIE, UPLOAD_SESSION_TTL_MS } from '@/server/admin/files';
import { allowPublicRequest } from '@/server/public/rate-limit';
import { getPublicSiteSettings } from '@/server/public/site-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cookie(request: Request, name: string): string | null {
  const raw = request.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/**
 * Upload contract (one file per request)
 * in:  multipart { kind: 'attachment' | 'cv', file }
 * out: 200 { status: 'test-validated' | 'stored', id, size }
 *      400/403/413/415/422/429/503 { status, code }
 *
 * Validates declared type, extension, size and the file's content signature.
 * Preview mode discards the bytes after validation (nothing is stored).
 * Live mode stores quote attachments and CVs in private storage, bound to this browser's
 * upload-session cookie, so an upload ID alone can never attach someone else's file. Submitted
 * files are never written under /public and are unavailable to staff until scanned or
 * deliberately released.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ status: 'error', code: 'forbidden' }, 403);
  if (!uploadsEnabled('attachment') && !uploadsEnabled('cv')) return json({ status: 'unavailable', code: 'unavailable' }, 503);
  if (!(await allowPublicRequest(`upl:${clientKey(request)}`, Number(process.env.UPLOAD_RATE_LIMIT ?? 30), 10 * 60 * 1000)))
    return json({ status: 'rate-limited', code: 'rate-limited' }, 429, { 'retry-after': '600' });

  const declared = Number(request.headers.get('content-length') ?? '0');
  const cap = LIMITS.attachments.maxFileBytes + 64 * 1024;
  if (!declared || declared > cap) return json({ status: 'error', code: 'fileTooLarge' }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ status: 'error', code: 'bad-request' }, 400);
  }
  const kind = form.get('kind') === 'cv' ? 'cv' : 'attachment';
  if (!uploadsEnabled(kind)) return json({ status: 'unavailable', code: 'unavailable' }, 503);
  const file = form.get('file');
  if (!(file instanceof File)) return json({ status: 'error', code: 'bad-request' }, 400);

  const metaError = checkFileMeta(kind, file.name, file.type, file.size);
  if (metaError) return json({ status: 'rejected', code: metaError }, 422);

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detected = detectFileType(head);
  if (!detected || (file.type && detected !== file.type) || (kind === 'cv' && detected !== 'application/pdf'))
    return json({ status: 'rejected', code: 'fileSignature' }, 422);

  const mode = getFormMode(kind === 'cv' ? 'career' : 'quote');
  if (mode === 'preview') {
    // Original filename is never used as a storage key or path.
    const rec = registerUpload({ kind, size: file.size, type: detected });
    return json({ status: 'test-validated', id: rec.id, size: rec.size });
  }

  const token = cookie(request, UPLOAD_SESSION_COOKIE) ?? newUploadSessionToken();
  try {
    if (kind === 'cv' && !(await getPublicSiteSettings()).careerIntakeOpen) return json({ status: 'closed', code: 'closed' }, 503);
    const db = await getDb();
    const rec = await storePublicUpload(db, {
      bytes: Buffer.from(await file.arrayBuffer()),
      originalName: file.name,
      mimeType: detected,
      uploadToken: token,
      kind: kind === 'cv' ? 'cv' : 'enquiry',
    });
    const secure = (process.env.SITE_URL ?? '').startsWith('https://') || new URL(request.url).protocol === 'https:';
    const setCookie = `${UPLOAD_SESSION_COOKIE}=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${UPLOAD_SESSION_TTL_MS / 1000}${secure ? '; Secure' : ''}`;
    return json({ status: 'stored', id: rec.id, size: rec.size }, 200, { 'set-cookie': setCookie });
  } catch (e) {
    if (isDomainError(e) && e.code === 'validation') return json({ status: 'rejected', code: String(e.details?.code ?? 'fileRejected') }, 422);
    console.error('[uploads] not stored', e instanceof Error ? e.name : typeof e);
    return json({ status: 'unavailable', code: 'unavailable' }, 503);
  }
}
