import './env';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { message } from '@/server/db/schema';
import { createDraft, recordOfflineSend, sendMessage, updateDraft } from '@/server/admin/messages';
import { addNote, editNote } from '@/server/admin/notes';
import { addProposal, updateProposalDraft } from '@/server/admin/proposals';
import { overviewMetrics } from '@/server/admin/metrics';
import { assignRequest, changeStatus, getRequestDetail, setDisposition } from '@/server/admin/requests';
import { isAllowedTransition, reasonRequired } from '@/server/admin/workflow';
import { db, member, PDF, submit, version } from './fixtures';

type M = Awaited<ReturnType<typeof member>>;
const OUTBOX = join(tmpdir(), `znt-outbox-wf-${process.pid}`);
const TZ = 'Africa/Cairo';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

describe('workflow, concurrency and communication', () => {
  let owner: M, manager: M, reviewer: M;
  beforeAll(async () => {
    owner = await member('owner');
    manager = await member('manager');
    reviewer = await member('reviewer');
  }, 60_000);
  afterAll(() => rmSync(OUTBOX, { recursive: true, force: true }));

  it('defines forward, backward and reopen transitions with reasons where needed', () => {
    expect(isAllowedTransition('awaiting_information', 'in_review')).toBe(true);
    expect(isAllowedTransition('won', 'in_review')).toBe(true);
    expect(isAllowedTransition('new', 'won')).toBe(false);
    expect(isAllowedTransition('new', 'quote_sent')).toBe(false);
    expect(reasonRequired('in_review', 'lost')).toBe(true);
    expect(reasonRequired('won', 'in_review')).toBe(true);
    expect(reasonRequired('quote_sent', 'won')).toBe(false);
  });

  it('enforces reasons, assignee rule and send evidence on the server', async () => {
    const d = await db();
    const r = await submit({ company: 'Workflow Co' });
    await changeStatus(d, manager, r.id, { to: 'in_review', expectedVersion: await version(r.id) });
    await expect(changeStatus(d, manager, r.id, { to: 'won', expectedVersion: await version(r.id) })).rejects.toMatchObject({ code: 'invalid_transition' });
    await expect(changeStatus(d, manager, r.id, { to: 'lost', expectedVersion: await version(r.id) })).rejects.toMatchObject({ code: 'reason_required' });
    await expect(changeStatus(d, manager, r.id, { to: 'preparing_quote', expectedVersion: await version(r.id) })).rejects.toMatchObject({ code: 'assignee_required' });
    await assignRequest(d, manager, r.id, reviewer.userId, await version(r.id));
    await changeStatus(d, reviewer, r.id, { to: 'awaiting_information', expectedVersion: await version(r.id) });
    await changeStatus(d, reviewer, r.id, { to: 'in_review', expectedVersion: await version(r.id) }); // backward
    await changeStatus(d, reviewer, r.id, { to: 'preparing_quote', expectedVersion: await version(r.id) });
    await expect(changeStatus(d, manager, r.id, { to: 'quote_sent', expectedVersion: await version(r.id) })).rejects.toMatchObject({ code: 'evidence_required' });
    const p = await addProposal(d, manager, r.id, { bytes: PDF, fileName: 'Proposal v1.pdf', issueDate: today(), amount: '1500.50', currency: 'USD' });
    const offline = await recordOfflineSend(d, manager, r.id, { sentOn: today(), note: 'Sent from the shared mailbox (synthetic).', proposalId: p.id }, TZ);
    await changeStatus(d, manager, r.id, { to: 'quote_sent', evidenceMessageId: offline.id, expectedVersion: await version(r.id) });
    await changeStatus(d, manager, r.id, { to: 'won', expectedVersion: await version(r.id) });
    await expect(changeStatus(d, manager, r.id, { to: 'in_review', expectedVersion: await version(r.id) })).rejects.toMatchObject({ code: 'reason_required' });
    await changeStatus(d, owner, r.id, { to: 'in_review', reason: 'Client asked to revise scope (synthetic).', expectedVersion: await version(r.id) });
    const detail = await getRequestDetail(d, owner, r.id);
    expect(detail.statusEvents.map((e) => `${e.fromStatus ?? '-'}>${e.toStatus}`)).toEqual([
      '->new',
      'new>in_review',
      'in_review>awaiting_information',
      'awaiting_information>in_review',
      'in_review>preparing_quote',
      'preparing_quote>quote_sent',
      'quote_sent>won',
      'won>in_review',
    ]);
    expect(detail.statusEvents.at(-1)?.reason).toBe('Client asked to revise scope (synthetic).');
    // A sent proposal version is immutable.
    await expect(updateProposalDraft(d, manager, p.id, { issueDate: today(), amount: '1.00', currency: 'USD' })).rejects.toMatchObject({ code: 'conflict' });
    await expect(addProposal(d, manager, r.id, { bytes: PDF, fileName: 'x.pdf', issueDate: today(), amount: '10' })).rejects.toMatchObject({ code: 'validation', details: { field: 'currency' } });
  });

  it('detects simultaneous edits instead of overwriting them', async () => {
    const d = await db();
    const r = await submit({ company: 'Concurrency Co' });
    const seen = await version(r.id); // both staff opened the same version
    await changeStatus(d, owner, r.id, { to: 'in_review', expectedVersion: seen });
    await expect(changeStatus(d, manager, r.id, { to: 'awaiting_information', expectedVersion: seen })).rejects.toMatchObject({ code: 'conflict' });
    await expect(assignRequest(d, manager, r.id, reviewer.userId, seen)).rejects.toMatchObject({ code: 'conflict' });
    const note = await addNote(d, owner, r.id, 'First text (synthetic)');
    await editNote(d, owner, note.id, 'Second text (synthetic)', 1);
    await expect(editNote(d, owner, note.id, 'Stale edit', 1)).rejects.toMatchObject({ code: 'conflict' });
    await expect(editNote(d, manager, note.id, 'Not my note', 2)).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('keeps internal notes out of every client message and drafts in the client language', async () => {
    const d = await db();
    const marker = 'INTERNAL-ONLY-MARKER-7731';
    const r = await submit({ name: 'سارة تجريبية', company: 'شركة الاختبار — BIM Experts' }, { locale: 'ar' });
    await addNote(d, owner, r.id, `Do not share: ${marker}`);
    for (const key of ['acknowledgement', 'missing_information', 'proposal_cover', 'follow_up', null]) {
      await createDraft(d, owner, r.id, { templateKey: key });
    }
    const drafts = await d.select().from(message).where(eq(message.requestId, r.id));
    expect(drafts).toHaveLength(5);
    for (const m of drafts) {
      expect(m.language).toBe('ar');
      expect(m.toEmail).toBe('alex@example.invalid');
      expect(`${m.subject}\n${m.body}`).not.toContain(marker);
    }
    expect(drafts.find((m) => m.templateKey === 'acknowledgement')?.body).toContain('سارة تجريبية');
    // Recipients are limited to addresses on file for this request.
    const draft = drafts.find((m) => m.templateKey === 'acknowledgement')!;
    await expect(updateDraft(d, owner, draft.id, { toEmail: 'attacker@example.invalid', subject: 's', body: 'b', attachmentIds: [], expectedVersion: draft.version })).rejects.toMatchObject({ code: 'validation', details: { field: 'to' } });
  });

  it('sends only through the configured test adapter, idempotently, with this request’s proposal files only', async () => {
    const d = await db();
    const r = await submit({ company: 'Send Test Co' });
    const elsewhere = await submit({ company: 'Other Request Co' });
    const foreign = await addProposal(d, owner, elsewhere.id, { bytes: PDF, fileName: 'other.pdf', issueDate: today() });
    const own = await addProposal(d, owner, r.id, { bytes: PDF, fileName: 'Proposal – عرض.pdf', issueDate: today() });
    const { id } = await createDraft(d, owner, r.id, { templateKey: 'proposal_cover', attachmentIds: [own.attachmentId] });
    await expect(createDraft(d, owner, r.id, { templateKey: 'proposal_cover', attachmentIds: [foreign.attachmentId] })).rejects.toMatchObject({ code: 'validation' });
    // Not configured: nothing is sent and nothing claims to be sent.
    await expect(sendMessage(d, owner, id, 1)).rejects.toMatchObject({ code: 'email_not_configured' });
    expect((await d.select().from(message).where(eq(message.id, id)))[0].status).toBe('draft');

    process.env.EMAIL_TRANSPORT = 'outbox';
    process.env.OUTBOX_DIR = OUTBOX;
    await expect(sendMessage(d, reviewer, id, 1)).rejects.toMatchObject({ code: 'not_found' }); // not assigned
    const sent = await sendMessage(d, manager, id, 1);
    expect(sent.status).toBe('test_delivered');
    await expect(sendMessage(d, manager, id, sent.version)).rejects.toMatchObject({ code: 'conflict' });
    const files = readdirSync(OUTBOX);
    expect(files).toHaveLength(1);
    const mail = JSON.parse(readFileSync(join(OUTBOX, files[0]), 'utf8'));
    expect(mail.to).toBe('alex@example.invalid');
    expect(mail.attachments).toEqual([{ filename: 'Proposal – عرض.pdf', contentType: 'application/pdf', bytes: PDF.length }]);
    const detail = await getRequestDetail(d, owner, r.id);
    expect(detail.proposals.find((p) => p.id === own.id)?.status).toBe('sent');
    // Provider failure keeps a recoverable draft with the real failure state.
    process.env.OUTBOX_SIMULATE_FAILURE = '1';
    const second = await createDraft(d, owner, r.id, { templateKey: 'follow_up' });
    const failed = await sendMessage(d, manager, second.id, 1);
    expect(failed.status).toBe('failed');
    const [row] = await d.select().from(message).where(eq(message.id, second.id));
    expect(row).toMatchObject({ status: 'failed', attempts: 1 });
    expect(row.lastError).toContain('simulated provider failure');
    process.env.OUTBOX_SIMULATE_FAILURE = '';
    const retried = await sendMessage(d, manager, second.id, row.version);
    expect(retried.status).toBe('test_delivered');
    process.env.EMAIL_TRANSPORT = '';
  });

  it('computes metrics from real rows: unique requests, spam excluded, archive separate', async () => {
    const d = await db();
    const before = await overviewMetrics(d, owner, 30, TZ);
    const a = await submit({ company: 'Metric A', services: ['coordination', 'bim-modelling', 'design-review'] });
    const b = await submit({ company: 'Metric B' });
    const c = await submit({ company: 'Metric C' });
    await setDisposition(d, owner, [b.id], 'spam');
    await setDisposition(d, owner, [c.id], 'archived');
    const after = await overviewMetrics(d, owner, 30, TZ);
    expect(after.period.received - before.period.received).toBe(2); // a + archived c; spam excluded; services do not multiply
    expect(after.period.spam - before.period.spam).toBe(1);
    expect(after.current.new - before.current.new).toBe(1); // only a is still in the active pipeline
    expect(after.current.archived - before.current.archived).toBe(1);
    expect(after.volume).toHaveLength(30);
    await setDisposition(d, owner, [c.id], 'active');
    const restored = await overviewMetrics(d, owner, 30, TZ);
    expect(restored.current.new - after.current.new).toBe(1);
    const detail = await getRequestDetail(d, owner, a.id);
    expect(detail.request.status).toBe('new');
    const forReviewer = await overviewMetrics(d, reviewer, 30, TZ);
    expect(forReviewer.period.received).toBeLessThan(restored.period.received); // scoped to assigned work
  });
});
