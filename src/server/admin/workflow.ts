/**
 * Quote-request state machine (spec 04 §10). Archive and spam are dispositions, not statuses.
 * Backward moves and reopening are allowed with a reason; quote_sent needs a recorded send.
 */
import type { RequestStatus } from '../db/schema';

export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['in_review', 'awaiting_information', 'lost'],
  in_review: ['awaiting_information', 'preparing_quote', 'lost'],
  awaiting_information: ['in_review', 'preparing_quote', 'lost'],
  preparing_quote: ['quote_sent', 'in_review', 'awaiting_information', 'lost'],
  quote_sent: ['won', 'lost', 'preparing_quote', 'awaiting_information'],
  won: ['in_review'],
  lost: ['in_review'],
};

export function isAllowedTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** A reason is required to close as not proceeding, to reopen, and to move back from a sent quote. */
export function reasonRequired(from: RequestStatus, to: RequestStatus): boolean {
  return to === 'lost' || from === 'won' || from === 'lost' || (from === 'quote_sent' && to !== 'won');
}

/** Statuses that need an assignee when the "assignee before quoting" rule is on. */
export const ASSIGNEE_REQUIRED_FOR: RequestStatus[] = ['preparing_quote', 'quote_sent'];

/** quote_sent must reference a real send (or an explicitly labelled offline-send record). */
export function evidenceRequired(to: RequestStatus): boolean {
  return to === 'quote_sent';
}

export const OPEN_STATUSES: RequestStatus[] = ['new', 'in_review', 'awaiting_information', 'preparing_quote', 'quote_sent'];
