/**
 * Staff notifications (spec 04 §11).
 * - In-app notifications are per user (reading one never marks a colleague's as read).
 * - Staff email is a durable job row written in the same transaction as the event and processed
 *   after commit (route `after()`, `npm run jobs:run`, or POST /api/jobs/run from a scheduler).
 *   A provider failure never affects the stored enquiry; jobs retry up to MAX_JOB_ATTEMPTS.
 * - Notification emails carry the reference and a dashboard link only: no names, descriptions
 *   or file links.
 */
import { and, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import type { ApplicationKind } from '@/lib/admin/codes';
import type { Db, DbOrTx, Tx } from '../db/client';
import { application, inAppNotification, notificationJob, quoteRequest, teamMember, user } from '../db/schema';
import { emailTransport, sendEmail } from '../email/transport';
import { audit } from './audit';
import { assertCan, can, requestScopeCondition, type Actor } from './policy';
import { getSettings } from './settings';
import { newId, sanitizeError } from './util';

export const MAX_JOB_ATTEMPTS = 5;
const STALE_SENDING_MS = 10 * 60 * 1000;

function dashboardUrl(id: string, locale: 'en' | 'ar', section: 'requests' | 'applications' = 'requests') {
  const base = (process.env.BETTER_AUTH_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/${locale}/admin/${section}/${id}`;
}

async function activeLeads(db: DbOrTx) {
  return db
    .select({ userId: teamMember.userId, notifyEmail: teamMember.notifyEmail })
    .from(teamMember)
    .where(and(eq(teamMember.status, 'active'), inArray(teamMember.role, ['owner', 'manager'])));
}

/** Called inside the request-creation transaction. */
export async function enqueueNewRequest(tx: Tx, requestId: string) {
  const settings = await getSettings(tx);
  const leads = await activeLeads(tx);
  if (settings.notifyOnNewRequest && leads.length) {
    await tx
      .insert(inAppNotification)
      .values(leads.map((m) => ({ id: newId(), userId: m.userId, kind: 'new_request', requestId })))
      .onConflictDoNothing();
  }
  if (settings.emailNotifications && emailTransport() !== 'none') {
    const recipients = leads.filter((m) => m.notifyEmail);
    if (recipients.length) {
      await tx
        .insert(notificationJob)
        .values(
          recipients.map((m) => ({
            id: newId(),
            requestId,
            kind: 'new_request',
            recipientUserId: m.userId,
            idempotencyKey: `new_request:${requestId}:${m.userId}`,
          })),
        )
        .onConflictDoNothing();
    }
  }
}

/** Called inside the application-creation transaction (partner enquiry or career application). */
export async function enqueueNewApplication(tx: Tx, applicationId: string, kind: ApplicationKind) {
  const settings = await getSettings(tx);
  const leads = await activeLeads(tx);
  const notificationKind = kind === 'career' ? 'new_career' : 'new_partner';
  if (settings.notifyOnNewRequest && leads.length) {
    await tx.insert(inAppNotification).values(leads.map((m) => ({ id: newId(), userId: m.userId, kind: notificationKind, applicationId })));
  }
  if (settings.emailNotifications && emailTransport() !== 'none') {
    const recipients = leads.filter((m) => m.notifyEmail);
    if (recipients.length) {
      await tx
        .insert(notificationJob)
        .values(
          recipients.map((m) => ({
            id: newId(),
            applicationId,
            kind: notificationKind,
            recipientUserId: m.userId,
            idempotencyKey: `${notificationKind}:${applicationId}:${m.userId}`,
          })),
        )
        .onConflictDoNothing();
    }
  }
}

export async function notifyAssigned(tx: Tx, requestId: string, assigneeId: string | null, actorId: string, eventId: string) {
  if (!assigneeId || assigneeId === actorId) return;
  await tx
    .insert(inAppNotification)
    .values({ id: newId(), userId: assigneeId, kind: 'assigned', requestId })
    .onConflictDoUpdate({
      target: [inAppNotification.userId, inAppNotification.kind, inAppNotification.requestId],
      set: { createdAt: new Date(), readAt: null },
    });
  const settings = await getSettings(tx);
  if (!settings.emailNotifications || emailTransport() === 'none') return;
  const [m] = await tx.select({ notifyEmail: teamMember.notifyEmail }).from(teamMember).where(eq(teamMember.userId, assigneeId));
  if (!m?.notifyEmail) return;
  await tx
    .insert(notificationJob)
    .values({ id: newId(), requestId, kind: 'assigned', recipientUserId: assigneeId, idempotencyKey: `assigned:${eventId}` })
    .onConflictDoNothing();
}

export async function notifyFollowUpAssigned(tx: Tx, requestId: string, assigneeId: string, actorId: string) {
  if (assigneeId === actorId) return;
  await tx
    .insert(inAppNotification)
    .values({ id: newId(), userId: assigneeId, kind: 'followup_assigned', requestId })
    .onConflictDoUpdate({
      target: [inAppNotification.userId, inAppNotification.kind, inAppNotification.requestId],
      set: { createdAt: new Date(), readAt: null },
    });
}

function composeStaffEmail(kind: string, req: { id: string; reference: string }) {
  if (kind === 'new_partner') {
    return {
      subject: `[Zentrac] New partner enquiry ${req.reference} / استفسار شراكة جديد ${req.reference}`,
      text: `A new partner enquiry was received: ${req.reference}\nOpen: ${dashboardUrl(req.id, 'en', 'applications')}\n\nوصل استفسار شراكة جديد: ${req.reference}\nفتح: ${dashboardUrl(req.id, 'ar', 'applications')}\n`,
    };
  }
  if (kind === 'new_career') {
    return {
      subject: `[Zentrac] New career application ${req.reference} / طلب توظيف جديد ${req.reference}`,
      text: `A new career application was received: ${req.reference}\nOpen: ${dashboardUrl(req.id, 'en', 'applications')}\n\nوصل طلب توظيف جديد: ${req.reference}\nفتح: ${dashboardUrl(req.id, 'ar', 'applications')}\n`,
    };
  }
  if (kind === 'assigned') {
    return {
      subject: `[Zentrac] Request ${req.reference} assigned to you / تم إسناد الطلب ${req.reference} إليك`,
      text: `A quote request has been assigned to you: ${req.reference}\nOpen: ${dashboardUrl(req.id, 'en')}\n\nتم إسناد طلب عرض سعر إليك: ${req.reference}\nفتح: ${dashboardUrl(req.id, 'ar')}\n`,
    };
  }
  return {
    subject: `[Zentrac] New quote request ${req.reference} / طلب عرض سعر جديد ${req.reference}`,
    text: `A new quote request was received: ${req.reference}\nOpen: ${dashboardUrl(req.id, 'en')}\n\nوصل طلب عرض سعر جديد: ${req.reference}\nفتح: ${dashboardUrl(req.id, 'ar')}\n`,
  };
}

const eligible = () =>
  and(
    lt(notificationJob.attempts, MAX_JOB_ATTEMPTS),
    or(
      eq(notificationJob.status, 'queued'),
      eq(notificationJob.status, 'failed'),
      and(eq(notificationJob.status, 'sending'), lt(notificationJob.updatedAt, new Date(Date.now() - STALE_SENDING_MS))),
    ),
  );

/** Processes due notification jobs. Safe to run concurrently: each job is claimed atomically. */
export async function processNotificationJobs(db: Db, limit = 20) {
  const result = { sent: 0, failed: 0, skipped: 0 };
  const candidates = await db.select({ id: notificationJob.id }).from(notificationJob).where(eligible()).orderBy(notificationJob.createdAt).limit(limit);
  for (const c of candidates) {
    const [job] = await db
      .update(notificationJob)
      .set({ status: 'sending', attempts: sql`${notificationJob.attempts} + 1`, updatedAt: new Date() })
      .where(and(eq(notificationJob.id, c.id), eligible()))
      .returning();
    if (!job) continue;
    const finish = (status: 'sent' | 'test_delivered' | 'failed' | 'skipped', lastError: string | null) =>
      db.update(notificationJob).set({ status, lastError, updatedAt: new Date() }).where(eq(notificationJob.id, job.id));

    if (emailTransport() === 'none') {
      await finish('skipped', 'email transport not configured');
      result.skipped += 1;
      continue;
    }
    const [recipient] = job.recipientUserId
      ? await db
          .select({ email: user.email, status: teamMember.status })
          .from(user)
          .innerJoin(teamMember, eq(teamMember.userId, user.id))
          .where(eq(user.id, job.recipientUserId))
      : [];
    const [req] = job.requestId
      ? await db.select({ id: quoteRequest.id, reference: quoteRequest.reference }).from(quoteRequest).where(eq(quoteRequest.id, job.requestId))
      : job.applicationId
        ? await db.select({ id: application.id, reference: application.reference }).from(application).where(eq(application.id, job.applicationId))
        : [];
    if (!recipient || recipient.status !== 'active' || !req) {
      await finish('skipped', 'recipient or request no longer available');
      result.skipped += 1;
      continue;
    }
    const mail = composeStaffEmail(job.kind, req);
    try {
      const sent = await sendEmail({ to: recipient.email, subject: mail.subject, text: mail.text, idempotencyKey: `job-${job.id}` });
      await finish(sent.status, null);
      result.sent += 1;
    } catch (e) {
      await finish('failed', sanitizeError(e));
      result.failed += 1;
    }
  }
  return result;
}

/** Owner: requeue a failed job (resets its attempt budget). */
export async function retryNotificationJob(db: Db, actor: Actor, jobId: string) {
  assertCan(actor, 'settings.manage');
  const [job] = await db
    .update(notificationJob)
    .set({ status: 'queued', attempts: 0, lastError: null, updatedAt: new Date() })
    .where(and(eq(notificationJob.id, jobId), inArray(notificationJob.status, ['failed', 'skipped'])))
    .returning({ id: notificationJob.id, requestId: notificationJob.requestId, applicationId: notificationJob.applicationId });
  if (!job) return { requeued: false };
  await audit(db, { actorId: actor.userId, action: 'notification.requeued', category: 'settings', requestId: job.requestId, applicationId: job.applicationId, entityId: job.id });
  return { requeued: true };
}

export async function notificationJobSummary(db: Db, actor: Actor) {
  assertCan(actor, 'settings.manage');
  const counts = await db
    .select({ status: notificationJob.status, n: sql<number>`count(*)::int` })
    .from(notificationJob)
    .groupBy(notificationJob.status);
  const recentFailures = await db
    .select({
      id: notificationJob.id,
      kind: notificationJob.kind,
      status: notificationJob.status,
      attempts: notificationJob.attempts,
      lastError: notificationJob.lastError,
      updatedAt: notificationJob.updatedAt,
      reference: sql<string | null>`coalesce(${quoteRequest.reference}, ${application.reference})`,
    })
    .from(notificationJob)
    .leftJoin(quoteRequest, eq(quoteRequest.id, notificationJob.requestId))
    .leftJoin(application, eq(application.id, notificationJob.applicationId))
    .where(inArray(notificationJob.status, ['failed', 'skipped']))
    .orderBy(desc(notificationJob.updatedAt))
    .limit(10);
  return { counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number>, recentFailures };
}

/**
 * Notifications still visible to the actor: request notifications within their request scope,
 * and partner/career notifications only while they may view applications.
 */
function visibleNotification(actor: Actor) {
  const requests = and(isNotNull(quoteRequest.id), requestScopeCondition(actor));
  return can(actor, 'application.view') ? or(requests, isNotNull(application.id)) : requests;
}

/** The actor's own notifications, limited to records they may still view. */
export async function listNotifications(db: Db, actor: Actor, limit = 20) {
  const rows = await db
    .select({
      id: inAppNotification.id,
      kind: inAppNotification.kind,
      createdAt: inAppNotification.createdAt,
      readAt: inAppNotification.readAt,
      requestId: quoteRequest.id,
      applicationId: application.id,
      requestReference: quoteRequest.reference,
      applicationReference: application.reference,
    })
    .from(inAppNotification)
    .leftJoin(quoteRequest, eq(quoteRequest.id, inAppNotification.requestId))
    .leftJoin(application, eq(application.id, inAppNotification.applicationId))
    .where(and(eq(inAppNotification.userId, actor.userId), visibleNotification(actor)))
    .orderBy(desc(inAppNotification.createdAt))
    .limit(limit);
  return rows.map(({ requestReference, applicationReference, ...r }) => ({ ...r, reference: (requestReference ?? applicationReference) as string }));
}

export async function unreadNotificationCount(db: Db, actor: Actor): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(inAppNotification)
    .leftJoin(quoteRequest, eq(quoteRequest.id, inAppNotification.requestId))
    .leftJoin(application, eq(application.id, inAppNotification.applicationId))
    .where(and(eq(inAppNotification.userId, actor.userId), isNull(inAppNotification.readAt), visibleNotification(actor)));
  return row?.n ?? 0;
}

export async function markNotificationsRead(db: Db, actor: Actor, ids: string[] | 'all') {
  const conds = [eq(inAppNotification.userId, actor.userId), isNull(inAppNotification.readAt)];
  if (ids !== 'all') {
    if (!ids.length) return;
    conds.push(inArray(inAppNotification.id, ids.slice(0, 100)));
  }
  await db.update(inAppNotification).set({ readAt: new Date() }).where(and(...conds));
}
