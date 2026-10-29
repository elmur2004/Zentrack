// Quick route smoke test: status, lang/dir, single H1, no raw dictionary keys.
// Usage: node scripts/route-smoke.mjs http://localhost:3000
const base = process.argv[2] ?? 'http://localhost:3000';
const paths = [
  '', 'about', 'services', 'services/bim-modelling', 'services/coordination', 'services/shop-drawings',
  'services/design-review', 'services/quantities-as-built', 'infrastructure', 'how-we-work', 'clients',
  'projects', 'blog', 'request-a-quote', 'partners', 'careers', 'privacy',
];
const expect404 = ['projects/amaala-staff-village-zone-4', 'blog/what-is-an-rfi', 'services/survey', 'nope', 'review'];
let failures = 0;
for (const locale of ['en', 'ar']) {
  for (const p of paths) {
    const url = `${base}/${locale}${p ? `/${p}` : ''}`;
    const res = await fetch(url, { redirect: 'manual' });
    const html = await res.text();
    const htmlTag = /<html[^>]*>/.exec(html)?.[0] ?? '';
    const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
    const okLang = htmlTag.includes(`lang="${locale}"`) && htmlTag.includes(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`);
    const rawKey = /\b(?:home|common|nav|forms|about|projectsPage)\.[a-zA-Z]+\.[a-zA-Z]+/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''));
    const ok = res.status === 200 && okLang && h1s === 1 && !rawKey;
    if (!ok) failures++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${res.status} ${url} h1=${h1s} lang=${okLang} rawKey=${rawKey}`);
  }
  for (const p of expect404) {
    const url = `${base}/${locale}/${p}`;
    const res = await fetch(url, { redirect: 'manual' });
    const ok = res.status === 404;
    if (!ok) failures++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${res.status} ${url} (expect 404)`);
  }
}
for (const [p, loc] of [['/', '/en'], ['/about', '/en/about']]) {
  const res = await fetch(base + p, { redirect: 'manual' });
  const ok = [307, 308].includes(res.status) && (res.headers.get('location') ?? '').endsWith(loc);
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${res.status} ${p} -> ${res.headers.get('location')}`);
}
console.log(failures ? `\n${failures} failure(s)` : '\nall routes passed');
process.exit(failures ? 1 : 0);
