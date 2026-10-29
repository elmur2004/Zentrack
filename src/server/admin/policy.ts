/**
 * Server-side permission policy (spec 04 §5). Every admin page, action, export and file
 * download calls into this module; hiding a button is never the authorization.
 * Edit the matrix here to adapt roles to the owner's team (controlled policy layer).
 */
import { eq } from 'drizzle-orm';
import type { Role, RequestStatus } from '../db/schema';
import { quoteRequest } from '../db/schema';
import { DomainError } from './errors';

export type Capability =
  | 'request.view'
  | 'file.download'
  | 'request.assign'
  | 'request.note'
  | 'request.status'
  | 'request.clarify'
  | 'followup.manage'
  | 'message.draft'
  | 'message.send'
  | 'proposal.manage'
  | 'request.export'
  | 'request.archive'
  | 'request.spam'
  | 'request.delete'
  | 'file.release'
  | 'team.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'application.view'
  | 'application.manage'
  | 'application.delete';

/**
 * all = every request; assigned = only requests assigned to the actor; operational = request-related audit only.
 * Partner enquiries and career applications (application.*) are not assigned to individuals:
 * owners and managers handle them; reviewers and read-only members have no access (CVs are personal data).
 */
export type Scope = 'all' | 'assigned' | 'operational' | 'none';

export const POLICY: Record<Role, Record<Capability, Scope>> = {
  owner: {
    'request.view': 'all',
    'file.download': 'all',
    'request.assign': 'all',
    'request.note': 'all',
    'request.status': 'all',
    'request.clarify': 'all',
    'followup.manage': 'all',
    'message.draft': 'all',
    'message.send': 'all',
    'proposal.manage': 'all',
    'request.export': 'all',
    'request.archive': 'all',
    'request.spam': 'all',
    'request.delete': 'all',
    'file.release': 'all',
    'team.manage': 'all',
    'settings.manage': 'all',
    'audit.view': 'all',
    'application.view': 'all',
    'application.manage': 'all',
    'application.delete': 'all',
  },
  manager: {
    'request.view': 'all',
    'file.download': 'all',
    'request.assign': 'all',
    'request.note': 'all',
    'request.status': 'all',
    'request.clarify': 'all',
    'followup.manage': 'all',
    'message.draft': 'all',
    'message.send': 'all',
    'proposal.manage': 'all',
    'request.export': 'all',
    'request.archive': 'all',
    'request.spam': 'all',
    'request.delete': 'none',
    'file.release': 'all',
    'team.manage': 'none',
    'settings.manage': 'none',
    'audit.view': 'operational',
    'application.view': 'all',
    'application.manage': 'all',
    'application.delete': 'none',
  },
  reviewer: {
    'request.view': 'assigned',
    'file.download': 'assigned',
    'request.assign': 'none',
    'request.note': 'assigned',
    'request.status': 'assigned',
    'request.clarify': 'assigned',
    'followup.manage': 'assigned',
    'message.draft': 'assigned',
    'message.send': 'none',
    'proposal.manage': 'assigned',
    'request.export': 'none',
    'request.archive': 'none',
    'request.spam': 'none',
    'request.delete': 'none',
    'file.release': 'none',
    'team.manage': 'none',
    'settings.manage': 'none',
    'audit.view': 'none',
    'application.view': 'none',
    'application.manage': 'none',
    'application.delete': 'none',
  },
  read_only: {
    'request.view': 'assigned',
    'file.download': 'assigned',
    'request.assign': 'none',
    'request.note': 'none',
    'request.status': 'none',
    'request.clarify': 'none',
    'followup.manage': 'none',
    'message.draft': 'none',
    'message.send': 'none',
    'proposal.manage': 'none',
    'request.export': 'none',
    'request.archive': 'none',
    'request.spam': 'none',
    'request.delete': 'none',
    'file.release': 'none',
    'team.manage': 'none',
    'settings.manage': 'none',
    'audit.view': 'none',
    'application.view': 'none',
    'application.manage': 'none',
    'application.delete': 'none',
  },
};

/** Status changes a reviewer may make on an assigned request (ordinary workflow only). */
export const REVIEWER_TRANSITIONS = new Set<string>([
  'new>in_review',
  'in_review>awaiting_information',
  'awaiting_information>in_review',
  'in_review>preparing_quote',
  'awaiting_information>preparing_quote',
  'preparing_quote>in_review',
]);

export interface Actor {
  userId: string;
  name: string;
  email: string;
  role: Role;
  twoFactorEnabled: boolean;
}

/** An actor resolved from a live session (file links are bound to the session). */
export interface SessionActor extends Actor {
  sessionId: string;
  /** Owner policy requires two-factor enrolment that this user has not completed yet. */
  mfaEnrolmentRequired: boolean;
}

export function scopeOf(actor: Actor, cap: Capability): Scope {
  return POLICY[actor.role][cap];
}

export function can(actor: Actor, cap: Capability, request?: { assigneeId: string | null }): boolean {
  const scope = scopeOf(actor, cap);
  if (scope === 'all' || scope === 'operational') return true;
  if (scope === 'assigned') return !!request && request.assigneeId === actor.userId;
  return false;
}

/** Throws not_found (not forbidden) when the actor cannot even view the request, to avoid confirming IDs. */
export function assertCan(actor: Actor, cap: Capability, request?: { assigneeId: string | null }): void {
  if (request && !can(actor, 'request.view', request)) throw new DomainError('not_found');
  if (!can(actor, cap, request)) throw new DomainError('forbidden');
}

export function canTransition(actor: Actor, from: RequestStatus, to: RequestStatus): boolean {
  if (actor.role === 'owner' || actor.role === 'manager') return true;
  if (actor.role === 'reviewer') return REVIEWER_TRANSITIONS.has(`${from}>${to}`);
  return false;
}

/** SQL condition restricting list/metric queries to what the actor may view. */
export function requestScopeCondition(actor: Actor) {
  return scopeOf(actor, 'request.view') === 'all' ? undefined : eq(quoteRequest.assigneeId, actor.userId);
}
