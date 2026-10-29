import { describe, expect, it } from 'vitest';
import { projectToPublic, articleToPublic, hasForbiddenText } from '@/lib/content/projection';
import { findPrivateKeys } from '@/lib/checks';
import type { InternalAsset, InternalProject } from '@/lib/content/types';
import { internalProjects } from '@private/projects.internal';
import { internalAssets } from '@private/assets.internal';
import { draftArticles } from '@private/articles.drafts';
import publicProjects from '@/content/public/projects.generated.json';

// Synthetic fixture — not a real project.
const fixture: InternalProject = {
  id: 'FX1',
  slug: 'fixture-utilities-package',
  title: { en: 'Fixture Utilities Package', ar: 'حزمة مرافق تجريبية' },
  summary: { en: 'Synthetic summary.', ar: 'ملخص تجريبي.' },
  scope: { en: ['Scope line'], ar: ['سطر نطاق'] },
  countryCode: 'EG',
  sector: 'urban',
  serviceIds: ['coordination'],
  networkIds: ['water'],
  attribution: 'founder-bim-experts',
  projectParties: [{ name: 'Fixture Developer', role: { en: 'Developer', ar: 'المطور' } }],
  directAppointingParty: 'Fixture Contractor',
  assetIds: ['FXA'],
  publication: { state: 'approved', approvedFields: ['title', 'summary', 'country'], approvalEvidence: 'SECRET-EVIDENCE' },
  sources: [{ fileId: 'F3', locator: 'Projects!A1' }],
  internalNotes: ['SECRET-NOTE'],
};
const asset: InternalAsset = {
  id: 'FXA', projectId: 'FX1', registeredPath: 'x', actualSize: { width: 10, height: 10 }, publicFile: '/media/fx.webp',
  source: [], description: { en: 'd', ar: 'د' }, alt: { en: 'a', ar: 'ب' }, caption: { en: 'c', ar: 'ج' },
  publication: { state: 'withheld' }, internalNotes: [],
};

describe('public projection (explicit allowlist)', () => {
  it('withheld records never project publicly', () => {
    expect(projectToPublic({ ...fixture, publication: { state: 'withheld', approvedFields: [] } }, [asset])).toBeNull();
  });
  it('approving some fields publishes only those fields', () => {
    const p = projectToPublic(fixture, [asset])!;
    expect(p.title.en).toBe('Fixture Utilities Package');
    expect(p.summary?.en).toBe('Synthetic summary.');
    expect(p.countryCode).toBe('EG');
    expect(p.scope).toBeUndefined();
    expect(p.owners).toEqual([]);
    expect(p.directAppointingParty).toBeUndefined();
    expect(p.images).toEqual([]); // images not approved
    const json = JSON.stringify(p);
    expect(json).not.toContain('SECRET');
    expect(findPrivateKeys(p)).toEqual([]);
  });
  it('an approved image field still needs an approved asset', () => {
    const p = projectToPublic({ ...fixture, publication: { ...fixture.publication, approvedFields: ['title', 'images'] } }, [asset])!;
    expect(p.images).toEqual([]);
    const ok = projectToPublic(
      { ...fixture, publication: { ...fixture.publication, approvedFields: ['title', 'images'] } },
      [{ ...asset, publication: { state: 'approved' } }],
    )!;
    expect(ok.images[0].src).toBe('/media/fx.webp');
  });
  it('every supplied record is withheld or draft, so the public projection is empty', () => {
    expect(internalProjects.every((p) => p.publication.state !== 'approved')).toBe(true);
    expect(internalProjects.map((p) => projectToPublic(p, internalAssets)).filter(Boolean)).toEqual([]);
    expect(publicProjects).toEqual([]);
    expect(draftArticles.map((a) => articleToPublic(a)).filter(Boolean)).toEqual([]);
  });
  it('register-only groups do not assume a country', () => {
    for (const id of ['R03', 'R07', 'R08', 'R09']) expect(internalProjects.find((p) => p.id === id)?.countryCode).toBeUndefined();
  });
});

describe('forbidden claim / placeholder detection', () => {
  it.each(['[Email]', 'Reply within [XX] working days', 'zero rework', 'ISO-certified', '30+ projects', 'All files are covered by an NDA', 'Status: TBC'])(
    'flags "%s"',
    (s) => expect(hasForbiddenText(s)).toBeDefined(),
  );
  it('does not flag legitimate copy', () => {
    expect(hasForbiddenText('Founder experience since 2018')).toBeUndefined();
    expect(hasForbiddenText('Eleven infrastructure categories')).toBeUndefined();
  });
});
