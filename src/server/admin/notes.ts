/**
 * Internal notes (spec 04 §11). Plain text only, rendered as text (never HTML).
 * Notes live in request_note and are never read by the messaging or public code paths.
 * Edits keep the previous text in note_revision; there is no routine note deletion.
 */
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { noteRevision, quoteRequest, requestNote } from '../db/schema';
import { audit } from './audit';
import { DomainError } from './errors';
import { assertCan, can, type Actor } from './policy';
import { isRequestId } from './requests';
import { newId } from './util';

export const NOTE_MAX = 5000;

function cleanBody(body: string): string {
  const v = body.replace(/\r\n?/g, '\n').trim();
  if (!v || [...v].length > NOTE_MAX) throw new DomainError('validation', { field: 'body' });
  return v;
}

export async function addNote(db: Db, actor: Actor, requestId: string, body: string) {
  const text = cleanBody(body);
  if (!isRequestId(requestId)) throw new DomainError('not_found');
  return db.transaction(async (tx) => {
    const [req] = await tx.select({ assigneeId: quoteRequest.assigneeId }).from(quoteRequest).where(eq(quoteRequest.id, requestId)).limit(1);
    if (!req || !can(actor, 'request.view', req)) throw new DomainError('not_found');
    assertCan(actor, 'request.note', req);
    const id = newId();
    await tx.insert(requestNote).values({ id, requestId, authorId: actor.userId, body: text });
    await tx.update(quoteRequest).set({ updatedAt: new Date() }).where(eq(quoteRequest.id, requestId));
    await audit(tx, { actorId: actor.userId, action: 'note.added', category: 'request', requestId, entityId: id });
    return { id };
  });
}

/** Authors edit their own notes; the previous text is preserved as a revision. */
export async function editNote(db: Db, actor: Actor, noteId: string, body: string, expectedRevision: number) {
  const text = cleanBody(body);
  return db.transaction(async (tx) => {
    const [n] = await tx
      .select({ id: requestNote.id, requestId: requestNote.requestId, authorId: requestNote.authorId, body: requestNote.body, revision: requestNote.revision, assigneeId: quoteRequest.assigneeId })
      .from(requestNote)
      .innerJoin(quoteRequest, eq(quoteRequest.id, requestNote.requestId))
      .where(eq(requestNote.id, noteId))
      .for('update');
    if (!n || !can(actor, 'request.view', n)) throw new DomainError('not_found');
    assertCan(actor, 'request.note', n);
    if (n.authorId !== actor.userId) throw new DomainError('forbidden');
    if (n.revision !== expectedRevision) throw new DomainError('conflict', { revision: n.revision });
    if (n.body === text) return { revision: n.revision };
    await tx.insert(noteRevision).values({ id: newId(), noteId, body: n.body, editedBy: actor.userId });
    const [u] = await tx
      .update(requestNote)
      .set({ body: text, editedAt: new Date(), revision: sql`${requestNote.revision} + 1` })
      .where(and(eq(requestNote.id, noteId), eq(requestNote.revision, expectedRevision)))
      .returning({ revision: requestNote.revision });
    if (!u) throw new DomainError('conflict');
    await audit(tx, { actorId: actor.userId, action: 'note.edited', category: 'request', requestId: n.requestId, entityId: noteId });
    return { revision: u.revision };
  });
}
