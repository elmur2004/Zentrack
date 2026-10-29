import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/server/auth/auth';
import { databaseConfigured, getDb } from '@/server/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Better Auth endpoints (sign-in, two-factor, sign-out, password change). Fails closed. */
async function handle(request: Request) {
  const auth = getAuth();
  if (!auth || !databaseConfigured()) {
    return new Response(JSON.stringify({ code: 'unavailable' }), { status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
  await getDb(); // ensures the embedded database is migrated before first use
  const handler = toNextJsHandler(auth);
  return request.method === 'GET' ? handler.GET(request) : handler.POST(request);
}

export { handle as GET, handle as POST };
