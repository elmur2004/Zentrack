/**
 * npm run check:output   (after `npm run build`)
 * Audits the PUBLIC build output (.next, excluding caches) and /public for anything that must
 * not ship: withheld project names and parties, private field names, source filenames, review
 * routes, placeholder contacts. Pass --release to also fail on a localhost/unset production origin.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

async function main() {
const root = process.cwd();
const release = process.argv.includes('--release');
const dist = join(root, '.next');
if (!existsSync(dist)) {
  console.error('✗ .next not found — run npm run build first.');
  process.exit(1);
}

// Terms derived from the private records when available, plus a fixed baseline.
const terms = new Set<string>([
  'AMAALA', 'SEDRA', 'Qiddiya', 'Resort Core', 'King Fahd', 'King Salman Park', 'Arabian Gardens', 'Dabaa', 'Kigali',
  'Ghorayzat', 'Mansoura', 'Breiman', 'Al Bairaq', 'Ibrahim Al Khaleel', 'Park Ride', 'Red Sea Global', 'ROSHN',
  'Freyssinet', 'WASAC', 'Orascom', 'Concrete Plus', 'Elreda', 'Hassan Allam', 'CGC Arabia', 'China Railway',
  'قرية موظفي', 'الضبعة', 'كيجالي', 'غريزات', 'حديقة الملك سلمان',
  'internalNotes', 'approvalEvidence', 'private-source', 'review-media', 'Media_Register', 'Media_Brief',
  'Zentrac Company Profile.pdf', 'Simple Copy v2', 'Page Mockups', '03_Project_Images', 'integreted',
  '[Email]', '[Phone]', '[Website]', '[XX]', 'example.invalid',
]);
try {
  const { internalProjects } = await import('../private-source/content/projects.internal');
  const approvedTerms = new Set<string>();
  for (const p of internalProjects) {
    const own = [p.title.en.split(' — ')[0], ...p.projectParties.map((x) => x.name)];
    if (p.publication.state === 'approved') {
      // A published record's cleared name may appear; its parties only if 'owner' was approved.
      approvedTerms.add(own[0]);
      approvedTerms.add(p.title.ar);
      if (p.publication.approvedFields.includes('owner')) for (const n of own.slice(1)) approvedTerms.add(n);
    } else for (const t of own) terms.add(t);
  }
  for (const t of approvedTerms) for (const term of [...terms]) if (t.includes(term) || term.includes(t)) terms.delete(term);
} catch {
  /* private records not present on this machine: baseline terms still apply */
}

// Latin terms match on word boundaries (so "Mace" does not match "North Macedonia").
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchers: Array<[string, RegExp]> = [...terms]
  .filter((t) => t.length > 3)
  .map((t) => [t, /^[\x20-\x7e]+$/.test(t) && /^[A-Za-z]/.test(t) ? new RegExp(`(?<![A-Za-z])${escapeRe(t)}(?![A-Za-z])`) : new RegExp(escapeRe(t))]);

const SKIP_DIRS = new Set(['cache', 'dev', 'diagnostics', 'trace', 'types']);
const TEXT = /\.(html|rsc|js|mjs|cjs|json|txt|body|meta|css|xml|segment)$/i;
function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out);
    } else if (TEXT.test(name) || !name.includes('.')) out.push(p);
  }
  return out;
}

const files = [...walk(dist), ...walk(join(root, 'public'))];
const findings: string[] = [];
let localhostCanonical = false;
for (const f of files) {
  if (f.endsWith('.map')) {
    findings.push(`${relative(root, f)}: source map in output`);
    continue;
  }
  let text: string;
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  // required-server-files.* echo next.config (including the outputFileTracingExcludes list that
  // names private-source to keep it OUT of the bundle); that path string is not private data.
  const isConfigManifest = /required-server-files\.(json|js)$/.test(f);
  // IANA time-zone identifiers (e.g. the embedded database engine's tz data) are not project names.
  text = text.replace(/Africa\/Kigali/g, '');
  for (const [term, re] of matchers) {
    if (isConfigManifest && term === 'private-source') continue;
    if (re.test(text)) findings.push(`${relative(root, f)}: contains "${term}"`);
  }
  if (/rel="canonical" href="http:\/\/localhost/.test(text)) localhostCanonical = true;
}

// Credentials (SEC-02). Browser chunks must never read server-only secrets (`env.NAME` would mean
// server code leaked into the client; a variable *name* in admin help text is fine), and the actual
// values of secrets configured on this machine (process env and .env.local) must not appear in
// any output file. Values are compared, never printed.
const SECRET_NAMES = ['BETTER_AUTH_SECRET', 'DATABASE_URL', 'SMTP_PASSWORD', 'SMTP_USER', 'JOBS_RUNNER_TOKEN', 'ADMIN_OWNER_PASSWORD'];
const secretValues = new Map<string, string>();
for (const name of SECRET_NAMES) {
  const v = process.env[name];
  if (v && v.length >= 8) secretValues.set(name, v);
}
const envLocal = join(root, '.env.local');
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && SECRET_NAMES.includes(m[1]) && m[2].replace(/^["']|["']$/g, '').length >= 8) secretValues.set(m[1], m[2].replace(/^["']|["']$/g, ''));
  }
}
const clientDir = join(dist, 'static');
for (const f of files) {
  let text: string;
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  for (const [name, value] of secretValues) if (text.includes(value)) findings.push(`${relative(root, f)}: contains the configured value of ${name}`);
  if (f.startsWith(clientDir) || f.startsWith(join(root, 'public'))) {
    for (const name of SECRET_NAMES) {
      if (new RegExp(`\\benv\\s*(\\.\\s*${name}\\b|\\[\\s*["'\`]${name}["'\`]\\s*\\])`).test(text)) findings.push(`${relative(root, f)}: browser code reads ${name}`);
    }
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(ql)?:\/\/[^\s"']+:[^\s"']+@/.test(text)) findings.push(`${relative(root, f)}: browser file contains a key or database URL`);
  }
}

const appDir = join(dist, 'server', 'app');
if (existsSync(appDir)) {
  for (const loc of ['en', 'ar']) {
    if (existsSync(join(appDir, loc, 'review')) || existsSync(join(appDir, loc, 'review.html')))
      findings.push(`.next/server/app/${loc}/review: private review route compiled into the public build`);
  }
  if (existsSync(join(appDir, 'review-media'))) findings.push('.next/server/app/review-media: private media route compiled into the public build');
}

if (findings.length) {
  for (const f of [...new Set(findings)]) console.error(`✗ ${f}`);
  console.error(`\n${findings.length} output leak(s).`);
  process.exit(1);
}
const originMsg = localhostCanonical
  ? 'Canonical/hreflang URLs use the local origin (SITE_URL unset) — a launch blocker for production, fine for local QA.'
  : 'Canonical origin configured.';
if (release && localhostCanonical) {
  console.error(`✗ ${originMsg}`);
  process.exit(1);
}
console.log(`✓ Output audit OK — ${files.length} files scanned, ${terms.size} restricted terms, no review routes, no source maps.`);
console.log(`  Credentials: no browser code reads a server secret; ${secretValues.size} configured secret value(s) absent from all output.`);
console.log(`  ${originMsg}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
