/** Language-neutral domain errors. The UI translates `code`; details never contain secrets or SQL. */
export type ErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'invalid_transition'
  | 'reason_required'
  | 'assignee_required'
  | 'evidence_required'
  | 'file_unavailable'
  | 'email_not_configured'
  | 'last_owner'
  | 'already_exists'
  | 'invite_invalid'
  | 'link_expired'
  | 'mfa_required'
  | 'unavailable';

const STATUS: Record<ErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation: 422,
  invalid_transition: 422,
  reason_required: 422,
  assignee_required: 422,
  evidence_required: 422,
  file_unavailable: 409,
  email_not_configured: 409,
  last_owner: 409,
  already_exists: 409,
  invite_invalid: 410,
  link_expired: 410,
  mfa_required: 403,
  unavailable: 503,
};

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, string | number | boolean>;
  constructor(code: ErrorCode, details?: Record<string, string | number | boolean>) {
    super(code);
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
}

export function isDomainError(e: unknown): e is DomainError {
  return e instanceof DomainError;
}

/** Shape returned by server actions: never throws secrets to the client. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; code: ErrorCode; details?: Record<string, string | number | boolean> };

export async function toResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (isDomainError(e)) return { ok: false, code: e.code, details: e.details };
    // Log the error class only (no payloads); surface a generic failure.
    console.error('[admin] unexpected error', e instanceof Error ? e.name : typeof e);
    return { ok: false, code: 'unavailable' };
  }
}
