import { describe, expect, it } from 'vitest';
import { en, ar } from '@/i18n/messages';
import { plural, fmt, formatDate } from '@/i18n/format';
import { switchLocaleHref, allStaticRoutes } from '@/i18n/routes';
import { compareDictionaries } from '@/lib/checks';

describe('dictionaries', () => {
  it('Arabic mirrors every English key, array and placeholder', () => {
    expect(compareDictionaries(en, ar)).toEqual([]);
  });

  it('flags a missing Arabic key and a placeholder mismatch', () => {
    const issues = compareDictionaries({ a: 'Hello {name}', b: 'x' }, { a: 'مرحبا' });
    expect(issues.map((i) => i.message)).toEqual(expect.arrayContaining(['key missing in Arabic', 'placeholder mismatch {name} vs {}']));
  });
});

describe('locale switching keeps the equivalent page', () => {
  it('switches a nested service page', () => {
    expect(switchLocaleHref('/en/services/coordination', 'ar')).toBe('/ar/services/coordination');
    expect(switchLocaleHref('/ar/services/coordination', 'en')).toBe('/en/services/coordination');
  });
  it('keeps only allow-listed stable-ID query params and a safe anchor', () => {
    expect(switchLocaleHref('/en/request-a-quote', 'ar', 'service=coordination&name=Ali&scope=full', '#form')).toBe(
      '/ar/request-a-quote?service=coordination&scope=full#form',
    );
    expect(switchLocaleHref('/en/projects', 'ar', 'country=SA&service=<script>')).toBe('/ar/projects?country=SA');
  });
  it('never produces an external or protocol-relative target', () => {
    expect(switchLocaleHref('//evil.example/en', 'ar')).toBe('/ar');
    expect(switchLocaleHref('/en/https:evil', 'ar').startsWith('/ar')).toBe(true);
  });
  it('home maps to home', () => {
    expect(switchLocaleHref('/en', 'ar')).toBe('/ar');
  });
  it('registers all page families', () => {
    expect(allStaticRoutes()).toHaveLength(18);
  });
});

describe('plural messages (L16)', () => {
  const forms = en.projectsPage.results;
  const formsAr = ar.projectsPage.results;
  it('English', () => {
    expect([0, 1, 2, 3, 11, 100].map((n) => plural('en', n, forms))).toEqual([
      'No matching projects',
      'One project',
      '2 projects',
      '3 projects',
      '11 projects',
      '100 projects',
    ]);
  });
  it('Arabic uses zero/one/two/few/many/other with Western digits', () => {
    expect([0, 1, 2, 3, 11, 100].map((n) => plural('ar', n, formsAr))).toEqual([
      'لا توجد مشروعات مطابقة',
      'مشروع واحد',
      'مشروعان',
      '3 مشروعات',
      '11 مشروعًا',
      '100 مشروع',
    ]);
  });
});

describe('formatting', () => {
  it('fills placeholders without concatenating fragments', () => {
    expect(fmt('Reference: {id}', { id: 'ZNT-2026-0042' })).toBe('Reference: ZNT-2026-0042');
  });
  it('formats unambiguous Gregorian dates with Latin digits in Arabic', () => {
    expect(formatDate('en', '2026-03-02')).toBe('2 March 2026');
    expect(formatDate('ar', '2026-03-02')).toMatch(/^2 مارس 2026$/);
  });
});
