import './env';
import { beforeAll, describe, expect, it } from 'vitest';
import { listAudit } from '@/server/admin/audit';
import { buildExport, csvCell, previewExport } from '@/server/admin/exports';
import { defaultQuery } from '@/lib/admin/query';
import { db, member, submit } from './fixtures';

const TZ = 'Africa/Cairo';

describe('CSV export safety', () => {
  it('neutralises spreadsheet formulas and quotes every cell', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe(`"'=SUM(A1:A2)"`);
    expect(csvCell('+cmd|\' /C calc\'!A0')).toBe(`"'+cmd|' /C calc'!A0"`);
    expect(csvCell('-10')).toBe(`"'-10"`);
    expect(csvCell('@HYPERLINK("x")')).toBe(`"'@HYPERLINK(""x"")"`);
    expect(csvCell('\t=1')).toBe(`"'\t=1"`);
    expect(csvCell('  =1+1')).toBe(`"'  =1+1"`);
    expect(csvCell('＝1+1')).toBe(`"'＝1+1"`); // full-width equals sign
    expect(csvCell('line 1\nline "2", done')).toBe('"line 1\nline ""2"", done"');
    expect(csvCell('شركة الاختبار — BIM Experts')).toBe('"شركة الاختبار — BIM Experts"');
    expect(csvCell(null)).toBe('""');
  });
});

describe('permissioned export', () => {
  let owner: Awaited<ReturnType<typeof member>>;
  let manager: Awaited<ReturnType<typeof member>>;
  beforeAll(async () => {
    owner = await member('owner');
    manager = await member('manager');
    await submit({ company: '=HYPERLINK("http://example.invalid","x")', email: 'formula@example.invalid', details: '+cmd|\' /C calc\'!A0' });
    await submit({ name: 'سارة تجريبية', company: 'شركة الاختبار — BIM Experts', email: 'arabic@example.invalid', details: 'طلب ZNT-2026-0042\nسطر ثانٍ' }, { locale: 'ar' });
  }, 60_000);

  it('writes UTF-8 with BOM, localized headings, safe cells and no contact data by default', async () => {
    const d = await db();
    const preview = await previewExport(d, manager, { scope: 'filtered', query: defaultQuery('inbox'), include: [], language: 'ar' }, TZ);
    expect(preview.count).toBe(2);
    const out = await buildExport(d, manager, { scope: 'filtered', query: defaultQuery('inbox'), include: [], language: 'ar' }, TZ);
    expect([...out.csv.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = out.csv.subarray(3).toString('utf8');
    const [header, ...rows] = text.trimEnd().split('\r\n');
    expect(header).toContain('"الرقم المرجعي"');
    expect(header).toContain('(Africa/Cairo)');
    expect(text).toContain('"شركة الاختبار — BIM Experts"');
    expect(text).toContain(`"'=HYPERLINK(""http://example.invalid"",""x"")"`);
    expect(text).not.toContain('@example.invalid');
    expect(text).not.toContain('calc');
    expect(rows).toHaveLength(2);
  });

  it('includes optional personal fields only when explicitly requested', async () => {
    const d = await db();
    const out = await buildExport(d, owner, { scope: 'filtered', query: defaultQuery('inbox'), include: ['email', 'description'], language: 'en' }, TZ);
    const text = out.csv.toString('utf8');
    expect(text).toContain('"Email"');
    expect(text).toContain('arabic@example.invalid');
    expect(text).toContain(`"'+cmd|' /C calc'!A0"`);
    expect(text).toContain('"طلب ZNT-2026-0042\nسطر ثانٍ"'); // newline kept inside the quoted cell
  });

  it('records the export in the audit log without copying the data', async () => {
    const d = await db();
    const entries = await listAudit(d, owner, { category: 'export', limit: 10 });
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries[0].metadata).toMatchObject({ scope: 'filtered', count: 2, columns: ['email', 'description'] });
    expect(JSON.stringify(entries)).not.toContain('@example.invalid');
    expect(JSON.stringify(entries)).not.toContain('شركة');
  });
});
