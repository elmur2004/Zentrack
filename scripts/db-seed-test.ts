/**
 * npm run db:seed:test
 * SYNTHETIC TEST DATA ONLY — fictional people and companies on example.invalid addresses.
 *
 * Refuses to run unless the database is local (embedded PGlite, or a DATABASE_URL on
 * localhost) and empty of requests. Creates one account per role with a fresh random password
 * written to SEED_CREDENTIALS_FILE (default .data/test-credentials.json, gitignored) — never
 * printed and never hardcoded. Records are created through the same domain functions the
 * website and dashboard use, so status events, audit entries and attachments are realistic.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { closeDb, getDb } from '../src/server/db/client';
import { quoteRequest, statusEvent, teamMember } from '../src/server/db/schema';
import type { Role, RequestStatus } from '../src/lib/admin/codes';
import type { Actor } from '../src/server/admin/policy';
import { storePublicUpload } from '../src/server/admin/files';
import { addFollowUp } from '../src/server/admin/followups';
import { createDraft, recordOfflineSend } from '../src/server/admin/messages';
import { addNote } from '../src/server/admin/notes';
import { addProposal } from '../src/server/admin/proposals';
import { assignRequest, changeStatus, createFromPublicSubmission, setDisposition } from '../src/server/admin/requests';
import { createCredentialUser } from '../src/server/admin/team';
import { toLocalInputValue, zonedDayKey, zonedDayRange } from '../src/server/admin/time';

const url = process.env.DATABASE_URL?.trim();
if (url && !/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
  console.error('✗ Refusing to seed: DATABASE_URL is not a local database. Synthetic data must never reach production.');
  process.exit(2);
}
if (!url && process.env.DATABASE_DRIVER !== 'pglite') {
  console.error('✗ No local database configured (set DATABASE_DRIVER=pglite and PGLITE_DATA_DIR).');
  process.exit(2);
}

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n% SYNTHETIC TEST FILE\n', 'latin1');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const TZ = 'Africa/Cairo';
const DAY = 24 * 60 * 60 * 1000;

type Fixture = {
  locale: 'en' | 'ar';
  name: string;
  company: string;
  country: string;
  services: string[];
  scope?: string;
  details: string;
  phone?: string;
  files?: Array<{ name: string; type: 'pdf' | 'png' }>;
  daysAgo: number;
  assignee?: 'reviewer' | 'manager' | 'readonly';
  path?: RequestStatus[];
  disposition?: 'archived' | 'spam';
  followUp?: 'overdue' | 'today' | 'upcoming';
  note?: string;
  reference?: string;
};

const F: Fixture[] = [
  { locale: 'ar', name: 'سارة تجريبية', company: 'شركة الاختبار — BIM Experts', country: 'EG', services: ['coordination', 'bim-modelling'], scope: 'package', details: 'طلب ZNT-2026-0042: نحتاج إلى تنسيق نماذج BIM / LOD 400 لمشروع تجريبي يضم شبكات مياه وصرف. هذه بيانات اختبار فقط.', phone: '+999 555 0101', files: [{ name: 'مخطط-التنسيق-01.pdf', type: 'pdf' }], daysAgo: 1, assignee: 'reviewer', path: ['in_review'], followUp: 'today', note: 'ملاحظة داخلية تجريبية: راجع ملف التنسيق أولًا.', reference: 'ZNT-2026-0042' },
  { locale: 'en', name: 'Alex Test', company: 'Test Contractor Ltd', country: 'GB', services: ['shop-drawings'], details: 'Synthetic enquiry: shop drawings for a fictional utilities corridor, BIM / LOD 400, Revit + Navisworks clash detection. Test data only.', phone: '+999 555 0102', files: [{ name: 'Coordination plan (rev B).pdf', type: 'pdf' }, { name: 'site-photo.png', type: 'png' }], daysAgo: 2, assignee: 'reviewer', path: ['in_review', 'awaiting_information'], followUp: 'overdue' },
  { locale: 'en', name: 'Sam Example', company: 'Example Engineering Co.', country: 'AE', services: ['design-review', 'coordination'], scope: 'review', details: 'Synthetic enquiry: independent design review of a fictional road network model before tender. Test data only.', daysAgo: 3, path: [] },
  { locale: 'ar', name: 'محمد الاختبار', company: 'مكتب المثال للاستشارات الهندسية', country: 'SA', services: ['quantities-as-built'], details: 'استفسار تجريبي: حصر كميات ومخططات As-Built لمشروع بنية تحتية خيالي. بيانات اختبار فقط.', phone: '+999 555 0104', daysAgo: 4, assignee: 'manager', path: ['in_review', 'preparing_quote'], followUp: 'upcoming' },
  { locale: 'en', name: 'Jordan Sample', company: 'Sample Infrastructure JV', country: 'QA', services: ['bim-modelling'], scope: 'support', details: 'Synthetic enquiry: modelling support for a fictional drainage package. Test data only.', daysAgo: 5, assignee: 'manager', path: ['in_review', 'preparing_quote', 'quote_sent'] },
  { locale: 'ar', name: 'ليلى تجريبية', company: 'شركة البناء التجريبية', country: 'KW', services: ['coordination'], details: 'استفسار تجريبي لتنسيق متعدد التخصصات. بيانات اختبار فقط.', daysAgo: 6, assignee: 'reviewer', path: ['in_review', 'preparing_quote'] },
  { locale: 'en', name: 'Casey Fixture', company: 'Fictional Utilities Authority (test)', country: 'DE', services: ['not-sure'], details: 'Synthetic enquiry with a request to discuss options. Test data only.', daysAgo: 8, path: ['in_review'] },
  { locale: 'en', name: 'Morgan Demo', company: 'Demo Developments', country: 'JO', services: ['shop-drawings', 'quantities-as-built'], details: 'Synthetic enquiry: shop drawings and quantities for a fictional site. Test data only.', daysAgo: 10, assignee: 'manager', path: ['in_review', 'preparing_quote', 'quote_sent', 'won'] },
  { locale: 'ar', name: 'خالد المثال', company: 'مؤسسة الاختبار للمقاولات', country: 'EG', services: ['design-review'], details: 'استفسار تجريبي لمراجعة تصميم. بيانات اختبار فقط.', daysAgo: 12, path: ['in_review', 'lost'] },
  { locale: 'en', name: 'Riley Placeholder', company: 'Placeholder Partners', country: 'EG', services: ['bim-modelling', 'coordination'], details: 'Synthetic enquiry kept for archive tests. Test data only.', daysAgo: 20, disposition: 'archived' },
  { locale: 'en', name: 'Spam Bot (test)', company: 'Spam Test Inc', country: 'GB', services: ['not-sure'], details: 'Synthetic spam-like message for disposition tests. Test data only.', daysAgo: 7, disposition: 'spam' },
  { locale: 'en', name: 'Formula Test', company: '=HYPERLINK("http://example.invalid","x")', country: 'GB', services: ['coordination'], details: "+cmd|' /C calc'!A0 — synthetic formula-injection test value. Test data only.", daysAgo: 9, assignee: 'readonly', path: ['in_review'] },
  { locale: 'ar', name: 'نور التجريبية', company: 'شركة نص طويل جدًا للاختبار '.repeat(5).trim().slice(0, 158), country: 'AE', services: ['coordination', 'design-review', 'shop-drawings'], details: ('وصف طويل تجريبي لاختبار التفاف النص في اللوحة دون قص الحروف العربية أو الأرقام 2026 أو المعرّفات مثل BIM-LOD-400. '.repeat(30)).slice(0, 3900), daysAgo: 11, path: [] },
];

// Additional plain records so pagination has more than one page.
for (let i = 0; i < 18; i += 1) {
  const ar = i % 3 === 0;
  F.push({
    locale: ar ? 'ar' : 'en',
    name: ar ? `مستخدم تجريبي ${i + 1}` : `Test Person ${i + 1}`,
    company: ar ? `شركة تجريبية ${i + 1}` : `Example Company ${i + 1}`,
    country: ['EG', 'SA', 'AE', 'GB', 'QA'][i % 5],
    services: [['coordination'], ['bim-modelling'], ['shop-drawings', 'design-review'], ['quantities-as-built']][i % 4],
    details: ar ? 'استفسار تجريبي إضافي لاختبار التصفح بين الصفحات. بيانات اختبار فقط.' : 'Additional synthetic enquiry for pagination tests. Test data only.',
    daysAgo: 14 + i * 2,
    path: i % 4 === 0 ? ['in_review'] : [],
  });
}

async function main() {
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(quoteRequest);
  if (n > 0) {
    console.error('✗ Refusing to seed: the database already contains requests. Seed only an empty local test database.');
    process.exit(2);
  }

  const roles: Record<string, { name: string; email: string; role: Role }> = {
    owner: { name: 'Test Owner', email: 'owner@example.invalid', role: 'owner' },
    manager: { name: 'Test Manager', email: 'manager@example.invalid', role: 'manager' },
    reviewer: { name: 'Test Reviewer', email: 'reviewer@example.invalid', role: 'reviewer' },
    reviewer2: { name: 'Second Reviewer', email: 'reviewer2@example.invalid', role: 'reviewer' },
    readonly: { name: 'Read-only Viewer', email: 'readonly@example.invalid', role: 'read_only' },
  };
  const credentials: Record<string, { email: string; password: string; role: Role }> = {};
  const actors: Record<string, Actor> = {};
  for (const [key, r] of Object.entries(roles)) {
    const password = randomBytes(18).toString('base64url');
    const userId = await createCredentialUser(r.email, r.name, password);
    await db.insert(teamMember).values({ userId, role: r.role });
    credentials[key] = { email: r.email, password, role: r.role };
    actors[key] = { userId, name: r.name, email: r.email, role: r.role, twoFactorEnabled: false };
  }
  const owner = actors.owner;

  let index = 0;
  for (const f of F) {
    index += 1;
    const token = randomBytes(24).toString('base64url');
    const ids: string[] = [];
    for (const file of f.files ?? []) {
      const up = await storePublicUpload(db, { bytes: file.type === 'pdf' ? PDF : PNG, originalName: file.name, mimeType: file.type === 'pdf' ? 'application/pdf' : 'image/png', uploadToken: token });
      ids.push(up.id);
    }
    const receipt = await createFromPublicSubmission(db, {
      locale: f.locale,
      idempotencyKey: `seed-${index}-${randomBytes(8).toString('hex')}`,
      data: {
        name: f.name,
        company: f.company,
        email: `test${index}@example.invalid`,
        phone: f.phone?.replace(/\s/g, ''),
        country: f.country,
        services: f.services,
        scope: f.scope,
        details: f.details,
        attachments: ids,
      },
      sourcePage: `/${f.locale}/request-a-quote`,
      sourceService: f.services[0] === 'not-sure' ? null : f.services[0],
      uploadToken: token,
    });
    const [row] = await db.select({ id: quoteRequest.id }).from(quoteRequest).where(eq(quoteRequest.reference, receipt.reference));
    const id = row.id;
    if (f.reference) await db.update(quoteRequest).set({ reference: f.reference }).where(eq(quoteRequest.id, id));

    const version = async () => (await db.select({ v: quoteRequest.version }).from(quoteRequest).where(eq(quoteRequest.id, id)))[0].v;
    if (f.assignee) await assignRequest(db, owner, id, actors[f.assignee].userId, await version());
    for (const to of f.path ?? []) {
      let evidenceMessageId: string | undefined;
      if (to === 'quote_sent') {
        const p = await addProposal(db, owner, id, { bytes: PDF, fileName: `Proposal ${index} (test).pdf`, issueDate: toLocalInputValue(new Date(), TZ).slice(0, 10), amount: '125000.00', currency: 'EGP' });
        const sent = await recordOfflineSend(db, owner, id, { sentOn: toLocalInputValue(new Date(), TZ).slice(0, 10), note: 'Synthetic offline send record (test data).', proposalId: p.id }, TZ);
        evidenceMessageId = sent.id;
      }
      await changeStatus(db, owner, id, { to, reason: to === 'lost' ? 'Synthetic test reason: client paused the project.' : undefined, evidenceMessageId, expectedVersion: await version() });
    }
    if (f.followUp) {
      // "Today" stays within the current local day in Cairo, even close to midnight.
      const endOfToday = zonedDayRange(zonedDayKey(new Date(), TZ), TZ).end.getTime();
      const due = f.followUp === 'overdue' ? new Date(Date.now() - DAY) : f.followUp === 'today' ? new Date(Math.min(Date.now() + 60 * 60 * 1000, endOfToday - 2 * 60 * 1000)) : new Date(Date.now() + 3 * DAY);
      const assigneeId = f.assignee ? actors[f.assignee].userId : owner.userId;
      await addFollowUp(db, owner, id, { action: f.locale === 'ar' ? 'متابعة تجريبية مع العميل' : 'Synthetic follow-up call', dueLocal: toLocalInputValue(due, TZ), assigneeId }, TZ);
    }
    if (f.note) await addNote(db, owner, id, f.note);
    if (index === 2) await createDraft(db, owner, id, { templateKey: 'missing_information' });
    if (f.disposition) await setDisposition(db, owner, [id], f.disposition, 'Synthetic test disposition');

    // Spread received dates over recent weeks (fixture-only adjustment).
    const createdAt = new Date(Date.now() - f.daysAgo * DAY - index * 37 * 60 * 1000);
    await db.update(quoteRequest).set({ createdAt }).where(eq(quoteRequest.id, id));
    await db.update(statusEvent).set({ createdAt }).where(sql`${statusEvent.requestId} = ${id} and ${statusEvent.fromStatus} is null`);
  }

  const file = resolve(process.env.SEED_CREDENTIALS_FILE || '.data/test-credentials.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ note: 'SYNTHETIC TEST ACCOUNTS — local test database only', accounts: credentials }, null, 2), { mode: 0o600 });
  await closeDb();
  console.log(`✓ Seeded ${F.length} synthetic requests and ${Object.keys(roles).length} test accounts. Test credentials written to ${file} (gitignored).`);
}

main().catch(async (e) => {
  console.error('✗ Seed failed:', e instanceof Error ? `${e.name}: ${e.message}` : e);
  await closeDb().catch(() => {});
  process.exit(1);
});
