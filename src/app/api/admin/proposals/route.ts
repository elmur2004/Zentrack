import { getDb } from '@/server/db/client';
import { DomainError } from '@/server/admin/errors';
import { PROPOSAL_MAX_BYTES } from '@/server/admin/files';
import { addProposal } from '@/server/admin/proposals';
import { noStoreJson, withAdminActor } from '@/server/http/admin-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Staff upload of a prepared proposal PDF (multipart). Validated by signature, size and policy. */
export async function POST(request: Request) {
  return withAdminActor(
    request,
    async (actor) => {
      const declared = Number(request.headers.get('content-length') ?? '0');
      if (!declared || declared > PROPOSAL_MAX_BYTES + 64 * 1024) throw new DomainError('validation', { field: 'file', code: 'fileTooLarge' });
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        throw new DomainError('validation', { field: 'file' });
      }
      const file = form.get('file');
      if (!(file instanceof File)) throw new DomainError('validation', { field: 'file' });
      const db = await getDb();
      const result = await addProposal(db, actor, String(form.get('requestId') ?? ''), {
        bytes: Buffer.from(await file.arrayBuffer()),
        fileName: file.name,
        issueDate: String(form.get('issueDate') ?? ''),
        expiryDate: String(form.get('expiryDate') ?? '') || null,
        amount: String(form.get('amount') ?? '') || null,
        currency: String(form.get('currency') ?? '') || null,
      });
      return noStoreJson(result);
    },
    { mutate: true },
  );
}
