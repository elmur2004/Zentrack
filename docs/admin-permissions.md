# Dashboard permissions

All authorization happens **on the server** in one module: `src/server/admin/policy.ts`. Hidden buttons are a convenience only; every page, server action, route handler, export and file link calls the policy itself. To adapt roles to the team, edit the `POLICY` matrix (and `REVIEWER_TRANSITIONS`) there; the Team page renders the same matrix, so the UI and the documentation of record cannot drift.

## Roles

| Action (capability) | Owner | Manager | Reviewer | Read-only |
| --- | --- | --- | --- | --- |
| View requests (`request.view`) | All | All | Assigned only | Assigned only |
| View/download files (`file.download`) | All | All | Assigned only | Assigned only |
| Assign or reassign (`request.assign`) | Yes | Yes | No | No |
| Add internal notes (`request.note`) | Yes | Yes | Assigned only | No |
| Manage follow-ups (`followup.manage`) | Yes | Yes | Assigned only | No |
| Change workflow status (`request.status`) | Yes | Yes | Assigned, ordinary transitions only | No |
| Add clarifications (`request.clarify`) | Yes | Yes | Assigned only | No |
| Draft replies/proposals (`message.draft`, `proposal.manage`) | Yes | Yes | Assigned only | No |
| Send to clients / record offline sends (`message.send`) | Yes | Yes | No | No |
| Export CSV (`request.export`) | Yes | Yes | No | No |
| Archive / restore (`request.archive`) | Yes | Yes | No | No |
| Mark spam / restore (`request.spam`) | Yes | Yes | No | No |
| Release unscanned files (`file.release`) | Yes | Yes | No | No |
| Team and roles (`team.manage`) | Yes | No | No | No |
| Settings (`settings.manage`) | Yes | No | No | No |
| Audit activity (`audit.view`) | Everything | Operational subset (requests, files, communication, exports) | No | No |
| Permanent deletion (`request.delete`) | Yes, archived/spam only, typed confirmation | No | No | No |
| View partner enquiries and career applications, including CVs (`application.view`) | Yes | Yes | No | No |
| Update them: status, internal notes, CV release, archive/spam/restore (`application.manage`) | Yes | Yes | No | No |
| Permanently delete them (`application.delete`) | Yes, archived/spam only, typed confirmation | No | No | No |
| Public contact details and website form switches (part of `settings.manage`) | Yes | No | No | No |

**Partner enquiries and career applications** are not assigned to individuals: owners and managers handle them, and reviewers and read-only members have no access at all (no navigation item, a forbidden state on the page, not-found for record IDs and CV links, and no notifications). CVs are personal data, which is why access is narrower than for quote requests. Their status flow is New → In review → Contacted → Closed; reopening a closed record needs a reason.

**Reviewer transitions** (on assigned requests): New → In review; In review ↔ Awaiting information; In review / Awaiting information → Preparing quote; Preparing quote → In review. Recording outcomes (Quote sent, Won, Not proceeding) and reopening closed requests are owner/manager actions.

## Enforcement points

| Surface | Guard |
| --- | --- |
| Admin pages | `requireActor()` (live session + active membership + MFA policy) in the `(app)` layout and every page; pages call domain functions that assert capabilities. |
| Server actions (`src/server/actions/admin.ts`) | `requireActionActor()` then the domain function. Next.js checks the Origin of action requests. |
| Route handlers (`/api/admin/*`) | `withAdminActor()`: same-origin check for mutations, live session, MFA policy, then domain checks. |
| Lists, counts, metrics, search, exports | SQL-level scope (`requestScopeCondition`): a reviewer's queries can only ever touch requests assigned to them, so totals and filters never reveal other records. |
| Request detail and every per-request action | Loads the request, checks `request.view` first and answers **404** (not 403) when it is not visible — guessed or changed IDs reveal nothing. |
| Files | Link issue requires `file.download` on the file's request (or `application.view` for a CV) and a downloadable scan state; the 60 s token is bound to user **and** session; the download route re-checks session, membership, permission and state on every request. Reassignment, sign-out or revocation stops links immediately. |
| Partners & careers | `listApplications`, `getApplicationDetail` and every update assert `application.*` themselves; unknown or not-permitted IDs answer 404. Notifications for these records are listed only while the person may view applications. |
| Team | Last active owner cannot be demoted or revoked; nobody can revoke themselves. Revocation deletes every session at once. |
| Sign-in | Better Auth hook refuses to create sessions for anyone without an **active** membership (revoked or orphan accounts get "no dashboard access"). |

## Sessions and two-factor authentication

- Database sessions (12 h, refreshed hourly while active), **no cookie cache**: role changes and revocations apply to the very next request.
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` + `__Secure-` prefix on HTTPS. Nothing is stored in `localStorage` except the per-browser "sidebar collapsed" preference.
- Sign-out is a full page load, so no private page survives in the client router cache.
- Sign-in and two-factor verification are rate-limited per client (10 per 5 minutes, stored in the database).
- TOTP (authenticator app) with one-time backup codes, optional for every account. Owner decision of 28 Oct 2026 (OD-26): two-factor authentication is **not required**. The setting **Settings → Require two-factor authentication for owners and managers** stays off; if it is turned on later, privileged users without 2FA are confined to "Your account" until they enrol.

## Tests that prove it

- `tests/unit/admin/permissions.test.ts` — matrix, scoped lists/counts, not-found for guessed/changed/malformed IDs, denied actions per role, file links (wrong user, wrong session, no session, tampered token, expired token, reassignment), audit subset, last-owner rule, session revocation, deletion rules.
- `tests/unit/admin/auth.test.ts` — cookie attributes, server-side sign-out, no public sign-up, sign-in rate limit, revoked members refused.
- `tests/admin/02-access.spec.ts` — the same through the browser and raw HTTP: anonymous redirects/401s, cross-origin 403, reviewer/read-only/outsider journeys, stale tab and stale file link after sign-out, revocation of an open session.
- `tests/unit/admin/applications.test.ts` and `tests/admin/05b-partners-careers.spec.ts` — partner/career access per role, CV quarantine, session-bound CV links, owner-only deletion, notifications scoped to permitted viewers.
