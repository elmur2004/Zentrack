import { describe, expect, it } from 'vitest';
import { hasAnyContact, isLinkedInUrl, normalizeContactPhone, normalizeContacts, storedContacts, telHref, whatsappHref } from '@/lib/contacts';
import { emptyIndexPaths, publicRoutePaths, sitemapPaths } from '@/lib/public-routes';
import { pageMetadata } from '@/lib/seo';

describe('owner-managed contact channels', () => {
  it('normalizes international phone numbers and rejects local or malformed ones', () => {
    expect(normalizeContactPhone('+20 2 1234 5678')).toBe('+20 2 1234 5678');
    expect(normalizeContactPhone('0020-2-1234-5678')).toBe('+20 2 1234 5678');
    expect(normalizeContactPhone('+٢٠ ١٠٠ ١٢٣ ٤٥٦٧')).toBe('+20 100 123 4567');
    expect(normalizeContactPhone('02 1234 5678')).toBeNull();
    expect(normalizeContactPhone('+12')).toBeNull();
    expect(normalizeContactPhone('+20 2 1234 5678 ext 9')).toBeNull();
    expect(telHref('+20 2 1234 5678')).toBe('tel:+20212345678');
    expect(whatsappHref('+20 100 123 4567')).toBe('https://wa.me/201001234567');
  });

  it('accepts only https LinkedIn addresses', () => {
    expect(isLinkedInUrl('https://www.linkedin.com/company/example')).toBe(true);
    expect(isLinkedInUrl('https://linkedin.com/in/someone')).toBe(true);
    expect(isLinkedInUrl('http://www.linkedin.com/company/example')).toBe(false);
    expect(isLinkedInUrl('https://www.linkedin.com.evil.example/x')).toBe(false);
    expect(isLinkedInUrl('https://user:pw@www.linkedin.com/x')).toBe(false);
    expect(isLinkedInUrl('javascript:alert(1)')).toBe(false);
  });

  it('treats empty fields as “not shown” and reports the first invalid field', () => {
    expect(normalizeContacts({})).toEqual({ ok: true, value: { email: '', phone: '', whatsapp: '', linkedin: '' } });
    expect(normalizeContacts({ email: 'bad' })).toEqual({ ok: false, field: 'email' });
    expect(normalizeContacts({ whatsapp: '0100' })).toEqual({ ok: false, field: 'whatsapp' });
    expect(hasAnyContact(storedContacts({ email: 'office@example.com' }))).toBe(true);
    // A malformed stored value never reaches the website.
    expect(storedContacts({ email: '<script>' })).toEqual({ email: '', phone: '', whatsapp: '', linkedin: '' });
    expect(storedContacts('nonsense')).toEqual({ email: '', phone: '', whatsapp: '', linkedin: '' });
  });
});

describe('empty index pages (OD-29)', () => {
  it('keeps empty Projects/Insights pages reachable but out of the sitemap and search results', () => {
    const empty = emptyIndexPaths();
    for (const p of empty) {
      expect(publicRoutePaths()).toContain(p);
      expect(sitemapPaths()).not.toContain(p);
    }
    const meta = pageMetadata({ locale: 'en', path: 'projects', title: 'Projects', description: 'x', noindex: 'follow' });
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(pageMetadata({ locale: 'en', path: 'about', title: 'About', description: 'x' }).robots).toBeUndefined();
  });
});
