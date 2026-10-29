'use server';
/**
 * Server actions for the dashboard. Every action resolves the actor from the live session
 * (requireActionActor) and delegates to a domain function that enforces the permission policy.
 * Results are language-neutral codes ({ ok, code }); no stack traces, SQL or secrets are returned.
 * Next.js verifies the Origin of server-action requests (CSRF protection).
 */
import { revalidatePath } from 'next/cache';
import { APPLICATION_STATUSES, DISPOSITIONS, STATUSES, type ApplicationStatus, type Disposition, type RequestStatus } from '@/lib/admin/codes';
import { getDb } from '@/server/db/client';
import {
  addApplicationNote,
  changeApplicationStatus,
  deleteApplicationPermanently,
  listApplications,
  normalizeApplicationQuery,
  setApplicationDisposition,
} from '@/server/admin/applications';
import { DomainError, toResult } from '@/server/admin/errors';
import { issueFileLink, releaseAttachment } from '@/server/admin/files';
import { addFollowUp, closeFollowUp, myDueCount } from '@/server/admin/followups';
import { createDraft, markStuckSendingFailed, recordOfflineSend, sendMessage, updateDraft } from '@/server/admin/messages';
import { addNote, editNote } from '@/server/admin/notes';
import { listNotifications, markNotificationsRead, notificationJobSummary, processNotificationJobs, retryNotificationJob, unreadNotificationCount } from '@/server/admin/notifications';
import { updateProposalDraft } from '@/server/admin/proposals';
import { addClarification, assignRequest, bulkAssign, changeStatus, deleteRequestPermanently, setDisposition } from '@/server/admin/requests';
import { getSettings, PUBLIC_SETTING_KEYS, updateSettings, type AdminSettings } from '@/server/admin/settings';
import { clearPublicSiteSettingsCache } from '@/server/public/site-settings';
import { acceptInvitation, changeRole, createInvitation, revokeInvitation, setMemberAccess, setNotifyEmail } from '@/server/admin/team';
import { requireActionActor } from '@/server/auth/session';

const str = (v: unknown, max = 10000) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : -1);
const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 200) : []);

async function ctx() {
  const actor = await requireActionActor();
  const db = await getDb();
  return { actor, db };
}

// --- notifications ---------------------------------------------------------
export async function listNotificationsAction() {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return listNotifications(db, actor, 20);
  });
}

export async function unreadCountAction() {
  return toResult(async () => {
    const { actor, db } = await ctx();
    const { timezone } = await getSettings(db);
    const [notifications, due] = await Promise.all([unreadNotificationCount(db, actor), myDueCount(db, actor, timezone)]);
    return { notifications, due };
  });
}

export async function markNotificationsReadAction(which: string[] | 'all') {
  return toResult(async () => {
    const { actor, db } = await ctx();
    await markNotificationsRead(db, actor, which === 'all' ? 'all' : ids(which));
    return null;
  });
}

// --- requests ----------------------------------------------------------------
export async function assignAction(requestId: string, assigneeId: string | null, expectedVersion: number) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return assignRequest(db, actor, str(requestId, 64), assigneeId ? str(assigneeId, 64) : null, num(expectedVersion));
  });
}

export async function bulkAssignAction(requestIds: string[], assigneeId: string | null) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return bulkAssign(db, actor, ids(requestIds), assigneeId ? str(assigneeId, 64) : null);
  });
}

export async function changeStatusAction(requestId: string, input: { to: string; reason?: string; evidenceMessageId?: string; expectedVersion: number }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    if (!(STATUSES as readonly string[]).includes(input?.to)) throw new DomainError('validation', { field: 'status' });
    return changeStatus(db, actor, str(requestId, 64), {
      to: input.to as RequestStatus,
      reason: str(input.reason, 1200),
      evidenceMessageId: str(input.evidenceMessageId, 64) || undefined,
      expectedVersion: num(input.expectedVersion),
    });
  });
}

export async function setDispositionAction(requestIds: string[], to: string, reason?: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    if (!(DISPOSITIONS as readonly string[]).includes(to)) throw new DomainError('validation', { field: 'disposition' });
    return setDisposition(db, actor, ids(requestIds), to as Disposition, str(reason, 600));
  });
}

export async function addClarificationAction(requestId: string, input: { field: string; value: string; note?: string }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return addClarification(db, actor, str(requestId, 64), { field: str(input?.field, 40), value: str(input?.value, 4000), note: str(input?.note, 600) });
  });
}

export async function deleteRequestAction(requestId: string, confirmation: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return deleteRequestPermanently(db, actor, str(requestId, 64), str(confirmation, 40));
  });
}

// --- partner enquiries and career applications -------------------------------------
export async function listApplicationsAction(query: Record<string, unknown>) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return listApplications(db, actor, normalizeApplicationQuery(query ?? {}));
  });
}

export async function changeApplicationStatusAction(applicationId: string, input: { to: string; reason?: string; expectedVersion: number }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    if (!(APPLICATION_STATUSES as readonly string[]).includes(input?.to)) throw new DomainError('validation', { field: 'status' });
    return changeApplicationStatus(db, actor, str(applicationId, 64), { to: input.to as ApplicationStatus, reason: str(input.reason, 1200), expectedVersion: num(input.expectedVersion) });
  });
}

export async function addApplicationNoteAction(applicationId: string, body: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return addApplicationNote(db, actor, str(applicationId, 64), str(body, 6000));
  });
}

export async function setApplicationDispositionAction(applicationIds: string[], to: string, reason?: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    if (!(DISPOSITIONS as readonly string[]).includes(to)) throw new DomainError('validation', { field: 'disposition' });
    return setApplicationDisposition(db, actor, ids(applicationIds), to as Disposition, str(reason, 600));
  });
}

export async function deleteApplicationAction(applicationId: string, confirmation: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return deleteApplicationPermanently(db, actor, str(applicationId, 64), str(confirmation, 40));
  });
}

// --- notes / follow-ups -------------------------------------------------------
export async function addNoteAction(requestId: string, body: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return addNote(db, actor, str(requestId, 64), str(body, 6000));
  });
}

export async function editNoteAction(noteId: string, body: string, expectedRevision: number) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return editNote(db, actor, str(noteId, 64), str(body, 6000), num(expectedRevision));
  });
}

export async function addFollowUpAction(requestId: string, input: { action: string; dueLocal: string; assigneeId?: string | null }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    const { timezone } = await getSettings(db);
    return addFollowUp(db, actor, str(requestId, 64), { action: str(input?.action, 400), dueLocal: str(input?.dueLocal, 20), assigneeId: input?.assigneeId ? str(input.assigneeId, 64) : null }, timezone);
  });
}

export async function closeFollowUpAction(followUpId: string, outcome: 'completed' | 'cancelled') {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return closeFollowUp(db, actor, str(followUpId, 64), outcome === 'cancelled' ? 'cancelled' : 'completed');
  });
}

// --- files ----------------------------------------------------------------------
export async function fileLinkAction(attachmentId: string, mode: 'download' | 'preview') {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return issueFileLink(db, actor, str(attachmentId, 64), mode === 'preview' ? 'preview' : 'download');
  });
}

export async function releaseFileAction(attachmentId: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return releaseAttachment(db, actor, str(attachmentId, 64));
  });
}

// --- communication ------------------------------------------------------------
export async function createDraftAction(requestId: string, templateKey: string | null, attachmentIds: string[]) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return createDraft(db, actor, str(requestId, 64), { templateKey: templateKey ? str(templateKey, 40) : null, attachmentIds: ids(attachmentIds) });
  });
}

export async function updateDraftAction(messageId: string, input: { toEmail: string; subject: string; body: string; attachmentIds: string[]; expectedVersion: number }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return updateDraft(db, actor, str(messageId, 64), {
      toEmail: str(input?.toEmail, 254),
      subject: str(input?.subject, 400),
      body: str(input?.body, 9000),
      attachmentIds: ids(input?.attachmentIds),
      expectedVersion: num(input?.expectedVersion),
    });
  });
}

export async function sendMessageAction(messageId: string, expectedVersion: number) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return sendMessage(db, actor, str(messageId, 64), num(expectedVersion));
  });
}

export async function recordOfflineSendAction(requestId: string, input: { sentOn: string; note: string; proposalId?: string | null }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    const { timezone } = await getSettings(db);
    return recordOfflineSend(db, actor, str(requestId, 64), { sentOn: str(input?.sentOn, 12), note: str(input?.note, 1200), proposalId: input?.proposalId ? str(input.proposalId, 64) : null }, timezone);
  });
}

export async function markMessageFailedAction(messageId: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return markStuckSendingFailed(db, actor, str(messageId, 64));
  });
}

export async function updateProposalAction(proposalId: string, input: { issueDate: string; expiryDate?: string; amount?: string; currency?: string }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return updateProposalDraft(db, actor, str(proposalId, 64), {
      issueDate: str(input?.issueDate, 12),
      expiryDate: str(input?.expiryDate, 12) || null,
      amount: str(input?.amount, 40) || null,
      currency: str(input?.currency, 3) || null,
    });
  });
}

// --- team ---------------------------------------------------------------------------
export async function createInvitationAction(input: { email: string; name: string; role: string }) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return createInvitation(db, actor, { email: str(input?.email, 254), name: str(input?.name, 200), role: str(input?.role, 20) });
  });
}

export async function revokeInvitationAction(invitationId: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    await revokeInvitation(db, actor, str(invitationId, 64));
    return null;
  });
}

export async function changeRoleAction(userId: string, role: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return changeRole(db, actor, str(userId, 64), str(role, 20));
  });
}

export async function setMemberAccessAction(userId: string, status: 'active' | 'revoked') {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return setMemberAccess(db, actor, str(userId, 64), status === 'revoked' ? 'revoked' : 'active');
  });
}

/** Members set their own preference; owners may set anyone's. */
export async function setNotifyEmailAction(userId: string, enabled: boolean) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    await setNotifyEmail(db, actor, str(userId, 64), !!enabled);
    return null;
  });
}

// --- settings --------------------------------------------------------------------
export async function updateSettingsAction(patch: Partial<AdminSettings>) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    const allowed: Array<keyof AdminSettings> = [
      'timezone',
      'requireAssigneeForQuote',
      'notifyOnNewRequest',
      'emailNotifications',
      'requireMfaForPrivileged',
      'templates',
      'publicContacts',
      'partnerIntakeOpen',
      'careerIntakeOpen',
    ];
    const clean = Object.fromEntries(Object.entries(patch ?? {}).filter(([k]) => allowed.includes(k as keyof AdminSettings))) as Partial<AdminSettings>;
    const before = await getSettings(db);
    const saved = await updateSettings(db, actor, clean);
    if (PUBLIC_SETTING_KEYS.some((k) => JSON.stringify(before[k]) !== JSON.stringify(saved[k]))) {
      // Public pages show these details: drop the short in-process cache and regenerate every
      // prerendered page on its next visit (ISR), so the website reflects the change at once.
      clearPublicSiteSettingsCache();
      revalidatePath('/', 'layout');
    }
    return saved;
  });
}

export async function retryJobAction(jobId: string) {
  return toResult(async () => {
    const { actor, db } = await ctx();
    return retryNotificationJob(db, actor, str(jobId, 64));
  });
}

export async function runJobsAction() {
  return toResult(async () => {
    const { actor, db } = await ctx();
    await notificationJobSummary(db, actor); // owner-only check
    return processNotificationJobs(db, 50);
  });
}

// --- public: invitation acceptance (no session) --------------------------------------
export async function acceptInvitationAction(token: string, password: string) {
  return toResult(async () => {
    const db = await getDb();
    return acceptInvitation(db, str(token, 100), typeof password === 'string' ? password : '');
  });
}
