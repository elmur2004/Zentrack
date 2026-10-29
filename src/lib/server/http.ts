import 'server-only';

/** JSON response with no caching. Error payloads carry language-neutral codes only. */
export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

/** Same-origin check for browser submissions (CSRF mitigation for a JSON endpoint). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    if (host && o.host === host) return true;
    const site = process.env.SITE_URL?.trim();
    return !!site && new URL(site).host === o.host;
  } catch {
    return false;
  }
}

export function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'local').trim();
}

/** Reads a request body with a hard byte cap (works without a content-length header). */
export async function readLimited(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared && declared > maxBytes) return null;
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
