/** Shared guard for admin route handlers: same-origin, live session, policy errors → JSON codes. */
import { sameOrigin } from '@/lib/server/http';
import { isDomainError } from '../admin/errors';
import type { SessionActor } from '../admin/policy';
import { actorFromHeaders, adminAvailable } from '../auth/session';

export function noStoreJson(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', ...headers },
  });
}

export async function withAdminActor(request: Request, fn: (actor: SessionActor) => Promise<Response>, opts: { mutate?: boolean } = {}) {
  if (opts.mutate && !sameOrigin(request)) return noStoreJson({ code: 'forbidden' }, 403);
  if (!adminAvailable()) return noStoreJson({ code: 'unavailable' }, 503);
  try {
    const actor = await actorFromHeaders(request.headers);
    if (!actor) return noStoreJson({ code: 'unauthenticated' }, 401);
    if (actor.mfaEnrolmentRequired) return noStoreJson({ code: 'mfa_required' }, 403);
    return await fn(actor);
  } catch (e) {
    if (isDomainError(e)) return noStoreJson({ code: e.code, details: e.details }, e.status);
    console.error('[admin] route error', e instanceof Error ? e.name : typeof e);
    return noStoreJson({ code: 'unavailable' }, 503);
  }
}
