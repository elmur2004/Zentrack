import { after } from 'next/server';
import { LIMITS, validate, type FormType } from '@/lib/forms/schema';
import { getFormMode } from '@/lib/forms/config';
import { serviceSlugs } from '@/i18n/routes';
import { getIdempotent, getUpload, setIdempotent } from '@/lib/server/store';
import { clientKey, json, readLimited, sameOrigin } from '@/lib/server/http';
import { hashPayload, previewReceipt } from '@/lib/server/delivery';
import { getDb } from '@/server/db/client';
import { createApplicationFromPublicSubmission, type CareerData, type PartnerData } from '@/server/admin/applications';
import { isDomainError } from '@/server/admin/errors';
import { UPLOAD_SESSION_COOKIE } from '@/server/admin/files';
import { processNotificationJobs } from '@/server/admin/notifications';
import { createFromPublicSubmission } from '@/server/admin/requests';
import { allowPublicRequest } from '@/server/public/rate-limit';
import { getPublicSiteSettings } from '@/server/public/site-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES: FormType[] = ['quote', 'partner', 'career'];

function cookie(request: Request, name: string): string | null {
  const raw = request.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** Runs work after the response; outside a Next.js request scope (scripts, tests) it runs detached. */
function afterResponse(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task();
  }
}

/** Only a same-site page path and a known service slug are kept as origin context. */
function context(input: unknown): { page: string | null; service: string | null } {
  const c = (input && typeof input === 'object' ? input : {}) as { page?: unknown; service?: unknown };
  const page = typeof c.page === 'string' && /^\/(en|ar)(\/[a-z0-9-]{1,60}){0,3}\/?$/.test(c.page) ? c.page : null;
  const service = typeof c.service === 'string' && (serviceSlugs as readonly string[]).includes(c.service) ? c.service : null;
  return { page, service };
}

/**
 * Submit enquiry contract
 * in:  { type, locale, idempotencyKey, values, context? }
 * out: 200 { status: 'test' | 'received', reference }
 *      422 { status: 'field-errors', errors: [{ field, code }] }
 *      400/403/409/413/415/429/503 { status, code }   (503 'closed' = paused by the owner)
 * The receipt contains only the reference: never notes, staff details, status or audit data.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ status: 'error', code: 'forbidden' }, 403);
  if (!(request.headers.get('content-type') ?? '').includes('application/json'))
    return json({ status: 'error', code: 'unsupported-media-type' }, 415);
  if (!(await allowPublicRequest(`enq:${clientKey(request)}`, Number(process.env.ENQUIRY_RATE_LIMIT ?? 8), 10 * 60 * 1000)))
    return json({ status: 'rate-limited', code: 'rate-limited' }, 429, { 'retry-after': '600' });

  const raw = await readLimited(request, 64 * 1024);
  if (!raw) return json({ status: 'error', code: 'payload-too-large' }, 413);

  let body: { type?: string; locale?: string; idempotencyKey?: string; values?: Record<string, unknown>; context?: unknown };
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return json({ status: 'error', code: 'bad-request' }, 400);
  }

  const type = body.type as FormType;
  const locale = body.locale === 'ar' ? 'ar' : 'en';
  const key = body.idempotencyKey ?? '';
  if (!TYPES.includes(type) || !/^[a-zA-Z0-9-]{16,64}$/.test(key) || typeof body.values !== 'object' || !body.values)
    return json({ status: 'error', code: 'bad-request' }, 400);

  const mode = getFormMode(type);
  if (mode === 'unavailable') return json({ status: 'unavailable', code: 'unavailable' }, 503);

  const result = validate(type, body.values);
  if (!result.ok) return json({ status: 'field-errors', errors: result.errors }, 422);
  const data = result.data as Record<string, unknown>;

  if (mode === 'live') {
    const ctx = context(body.context);
    try {
      if (type !== 'quote') {
        const settings = await getPublicSiteSettings();
        if (!(type === 'partner' ? settings.partnerIntakeOpen : settings.careerIntakeOpen)) return json({ status: 'closed', code: 'closed' }, 503);
      }
      const db = await getDb();
      const uploadToken = cookie(request, UPLOAD_SESSION_COOKIE);
      // Durable dashboard record (database), idempotent by key + payload.
      const receipt =
        type === 'quote'
          ? await createFromPublicSubmission(db, { locale, idempotencyKey: key, data: data as never, sourcePage: ctx.page, sourceService: ctx.service, uploadToken })
          : type === 'partner'
            ? await createApplicationFromPublicSubmission(db, { kind: 'partner', locale, idempotencyKey: key, data: data as unknown as PartnerData, sourcePage: ctx.page, uploadToken })
            : await createApplicationFromPublicSubmission(db, { kind: 'career', locale, idempotencyKey: key, data: data as unknown as CareerData, sourcePage: ctx.page, uploadToken });
      // Staff notifications run after the response; failures are recorded on the job, never on the receipt.
      afterResponse(async () => {
        try {
          await processNotificationJobs(await getDb(), 10);
        } catch (e) {
          console.error('[enquiries] notification processing deferred', e instanceof Error ? e.name : typeof e);
        }
      });
      return json({ status: 'received', reference: receipt.reference });
    } catch (e) {
      if (isDomainError(e)) {
        if (e.code === 'validation') {
          const field = String(e.details?.field ?? (type === 'career' ? 'cv' : 'attachments'));
          return json({ status: 'field-errors', errors: [{ field, code: String(e.details?.code ?? 'fileExpired') }] }, 422);
        }
        if (e.code === 'conflict') return json({ status: 'error', code: 'idempotency-conflict' }, 409);
      }
      // Not saved: the visitor keeps their text and can retry with the same key.
      console.error('[enquiries] not stored', e instanceof Error ? e.name : typeof e);
      return json({ status: 'failed', code: 'failed' }, 503);
    }
  }

  // Preview (all forms): validate the referenced test uploads, then return a TEST- receipt.
  const ids: string[] = type === 'quote' ? ((data.attachments as string[]) ?? []) : data.cv ? [String(data.cv)] : [];
  let total = 0;
  for (const id of ids) {
    const up = getUpload(id);
    if (!up || up.kind !== (type === 'quote' ? 'attachment' : 'cv'))
      return json({ status: 'field-errors', errors: [{ field: type === 'quote' ? 'attachments' : 'cv', code: 'fileType' }] }, 422);
    total += up.size;
  }
  if (total > LIMITS.attachments.maxTotalBytes)
    return json({ status: 'field-errors', errors: [{ field: 'attachments', code: 'totalTooLarge' }] }, 422);

  // Idempotency: the same key + same payload returns the original outcome; a reused key with
  // different content is rejected.
  const hash = hashPayload({ type, data });
  const prior = getIdempotent(key);
  if (prior) {
    if (prior.hash !== hash) return json({ status: 'error', code: 'idempotency-conflict' }, 409);
    return json(prior.body, prior.status);
  }
  const receipt = previewReceipt();
  setIdempotent(key, { hash, status: 200, body: receipt });
  return json(receipt);
}

export function GET() {
  return json({ status: 'error', code: 'method-not-allowed' }, 405, { allow: 'POST' });
}
