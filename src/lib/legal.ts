/**
 * Approved privacy policy and retention rules (owner decisions of 28 Oct 2026: OD-04, OD-25).
 * The policy text (privacyPage in the dictionaries) interpolates these values, and the retention
 * job (src/server/admin/retention.ts) enforces the same numbers — change them together, with a
 * new policy version and date, and record the decision in docs/open-decisions.md.
 */
export const PRIVACY_POLICY = {
  /** Recorded with every submission (privacy_policy_version). */
  version: '2026-10-28',
  /** "Last updated" date shown on the policy (ISO, UTC). */
  updated: '2026-10-28',
} as const;

export const RETENTION = {
  /** Quote requests: deleted this long after the last activity on them (won requests are kept until deleted by the owner). */
  quoteMonths: 24,
  /** Partner enquiries: after the last activity. */
  partnerMonths: 24,
  /** Career applications, including any CV: after the last activity. */
  careerMonths: 12,
  /** Anything marked as spam: after being marked. */
  spamDays: 30,
  /** Files uploaded with a form that was never submitted. */
  abandonedUploadHours: 24,
  /** Hashed form-protection counters (rate limiting). */
  rateLimitHours: 24,
  /** Strictly necessary upload-session cookie that links uploads to a submission. */
  uploadCookieHours: 2,
} as const;

export function monthsBefore(now: Date, months: number): Date {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}
