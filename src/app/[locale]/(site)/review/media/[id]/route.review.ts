import { readFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { internalAssets } from '@/lib/review/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PRIVATE REVIEW ONLY — serves extracted source images to the local review build.
 * Allow-listed by asset ID; the path comes from the internal register, never from the request.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const asset = internalAssets.find((a) => a.id === id && a.actualFile);
  if (!asset?.actualFile) return new Response('Not found', { status: 404 });
  const root = process.cwd();
  const file = normalize(join(root, asset.actualFile));
  if (!file.startsWith(join(root, 'private-source'))) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        'content-type': file.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
