/**
 * npm run check:content
 * Publication gate for the source tree (run before every build):
 *  - dictionaries and public content contain no unresolved placeholders ([Email], [XX], TBC…)
 *    or unapproved claims (zero rework, clash-free, ISO-certified, 30+/40+/1M+, “8 years”, blanket NDA)
 *  - the public JSON projection contains no private fields and matches a fresh projection
 *  - no withheld/draft record is present in the public projection
 *  - /public contains no source documents and no copy of an extracted source image
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { en, ar } from '../src/i18n/messages';
import * as services from '../src/content/public/services';
import * as networks from '../src/content/public/networks';
import * as track from '../src/content/public/track';
import * as editorial from '../src/content/public/editorial';
import * as buildingSystems from '../src/content/public/building-systems';
import * as team from '../src/content/public/team';
import { publicArticles, publicDownloads, publicProjects } from '../src/content/public';
import { articleToPublic, projectToPublic } from '../src/lib/content/projection';
import { checkLocalizedRecords, findPrivateKeys, scanForbidden, type Issue } from '../src/lib/checks';

async function main() {
const root = process.cwd();
const issues: Issue[] = [];
const warnings: string[] = [];

// 1. Placeholder / claim scan over everything that can render publicly
issues.push(...scanForbidden({ en, ar }, 'messages'));
issues.push(...scanForbidden({ services, networks, track, editorial, buildingSystems, team }, 'content'));
issues.push(...scanForbidden({ publicProjects, publicArticles }, 'projection'));

// 2. Projection integrity
issues.push(...findPrivateKeys(publicProjects, 'projects.generated'));
issues.push(...findPrivateKeys(publicArticles, 'articles.generated'));
issues.push(...checkLocalizedRecords(publicProjects, 'projects.generated'));
issues.push(...checkLocalizedRecords(publicArticles, 'articles.generated'));

const privateDir = join(root, 'private-source', 'content');
if (existsSync(privateDir)) {
  const { internalProjects } = await import('../private-source/content/projects.internal');
  const { internalAssets } = await import('../private-source/content/assets.internal');
  const { draftArticles } = await import('../private-source/content/articles.drafts');
  const fresh = internalProjects.map((p) => projectToPublic(p, internalAssets)).filter(Boolean);
  const freshArticles = draftArticles.map((a) => articleToPublic(a)).filter(Boolean);
  if (JSON.stringify(fresh) !== JSON.stringify(publicProjects))
    issues.push({ path: 'projects.generated.json', message: 'out of date with private records — run npm run content:project' });
  if (JSON.stringify(freshArticles) !== JSON.stringify(publicArticles))
    issues.push({ path: 'articles.generated.json', message: 'out of date with draft records — run npm run content:project' });
  for (const p of publicProjects) {
    const rec = internalProjects.find((x) => x.id === p.id);
    if (!rec || rec.publication.state !== 'approved') issues.push({ path: `projects.${p.slug}`, message: 'record is not approved but is public' });
  }
} else {
  warnings.push('private-source/content not present: projection freshness not verified (expected on deploy machines).');
}

// 3. /public must not contain source documents or extracted source images
function walk(dir: string, out: string[] = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
const publicFiles = walk(join(root, 'public'));
const allowedDownloads = new Set(publicDownloads.map((d) => join(root, 'public', d.href)));
for (const f of publicFiles) {
  const ext = extname(f).toLowerCase();
  if (['.docx', '.xlsx', '.xls', '.doc', '.pptx'].includes(ext)) issues.push({ path: relative(root, f), message: 'source document in public/' });
  if (ext === '.pdf' && !allowedDownloads.has(f)) issues.push({ path: relative(root, f), message: 'PDF in public/ that is not a reviewed download' });
}
const extracted = walk(join(root, 'private-source', 'extracted')).filter((f) => /\.(jpe?g|png)$/i.test(f) && !/[\\/]pages[\\/]/.test(f));
if (extracted.length) {
  const privateHashes = new Set(extracted.map(sha));
  for (const f of publicFiles) if (privateHashes.has(sha(f))) issues.push({ path: relative(root, f), message: 'copy of an extracted source image in public/' });
}

for (const w of warnings) console.warn(`! ${w}`);
if (issues.length) {
  for (const i of issues) console.error(`✗ ${i.path}: ${i.message}`);
  console.error(`\n${issues.length} content issue(s).`);
  process.exit(1);
}
console.log(
  `✓ Content OK — ${publicProjects.length} public project(s), ${publicArticles.length} public article(s), ${publicFiles.length} public file(s) audited; no placeholders, private fields or source files found.`,
);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
