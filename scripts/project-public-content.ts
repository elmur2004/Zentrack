/**
 * npm run content:project
 * Builds the PUBLIC content projection from the private records:
 *   private-source/content/*.ts  →  src/content/public/{projects,articles}.generated.json
 * Only records whose publication.state is "approved" are projected, field by field, through
 * the explicit allowlist in src/lib/content/projection.ts. Run after an owner approval is recorded.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { internalProjects } from '../private-source/content/projects.internal';
import { internalAssets } from '../private-source/content/assets.internal';
import { draftArticles } from '../private-source/content/articles.drafts';
import { articleToPublic, projectToPublic } from '../src/lib/content/projection';
import { checkLocalizedRecords, findPrivateKeys, scanForbidden } from '../src/lib/checks';

const root = process.cwd();
const projects = internalProjects.map((p) => projectToPublic(p, internalAssets)).filter(Boolean);
const articles = draftArticles.map((a) => articleToPublic(a)).filter(Boolean);

const issues = [
  ...checkLocalizedRecords(projects, 'projects'),
  ...checkLocalizedRecords(articles, 'articles'),
  ...findPrivateKeys(projects, 'projects'),
  ...findPrivateKeys(articles, 'articles'),
  ...scanForbidden(projects, 'projects'),
  ...scanForbidden(articles, 'articles'),
];
for (const p of projects) {
  for (const img of p!.images) {
    if (!existsSync(join(root, 'public', img.src))) issues.push({ path: `projects.${p!.slug}`, message: `public image missing: ${img.src}` });
  }
}
if (issues.length) {
  for (const i of issues) console.error(`✗ ${i.path}: ${i.message}`);
  process.exit(1);
}

writeFileSync(join(root, 'src/content/public/projects.generated.json'), `${JSON.stringify(projects, null, 2)}\n`);
writeFileSync(join(root, 'src/content/public/articles.generated.json'), `${JSON.stringify(articles, null, 2)}\n`);

const withheld = internalProjects.filter((p) => p.publication.state !== 'approved').length;
const drafts = draftArticles.filter((a) => a.publication.state !== 'approved').length;
console.log(`✓ Public projection written: ${projects.length} project(s), ${articles.length} article(s).`);
console.log(`  Not published: ${withheld} project record(s) withheld/draft, ${drafts} article(s) in draft.`);
