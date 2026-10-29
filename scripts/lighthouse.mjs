// Runs Lighthouse (lab) against the local production server and records the results.
// Usage: node scripts/lighthouse.mjs http://localhost:3005 /en /ar [--runs=3] [--out=docs/lighthouse]
// (requires `npx playwright install chromium`)
// Lab results are not field data: they cannot establish real-user LCP/INP/CLS percentiles.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const args0 = process.argv.slice(2);
const runsArg = args0.find((a) => a.startsWith('--runs='));
const runs = runsArg ? Number(runsArg.slice(7)) : 1;
const outArg = args0.find((a) => a.startsWith('--out='));
const outDir = outArg ? outArg.slice(6) : 'docs/lighthouse';
const [base, ...paths] = args0.filter((a) => !a.startsWith('--'));
const chrome = chromium.executablePath();
mkdirSync(outDir, { recursive: true });
const summary = [];
for (const path of paths) {
  for (const preset of ['mobile', 'desktop']) {
    const name = `${path.replace(/\//g, '_').replace(/^_/, '') || 'root'}-${preset}`;
    const results = [];
    for (let i = 0; i < runs; i++) {
      const out = `${outDir}/${name}${runs > 1 ? `-run${i + 1}` : ''}.json`;
      const args = [
        '--yes', 'lighthouse@12.8.2', base + path, '--quiet',
        '--chrome-flags=--headless=new --no-sandbox',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json', `--output-path=${out}`,
      ];
      if (preset === 'desktop') args.push('--preset=desktop');
      execFileSync('npx', args, { env: { ...process.env, CHROME_PATH: chrome }, stdio: 'ignore', shell: process.platform === 'win32' });
      const r = JSON.parse(readFileSync(out, 'utf8'));
      const score = (k) => (r.categories[k] ? Math.round(r.categories[k].score * 100) : 'n/a');
      const a = r.audits;
      results.push({
        page: path, preset,
        performance: score('performance'), accessibility: score('accessibility'), bestPractices: score('best-practices'), seo: score('seo'),
        FCP: a['first-contentful-paint'].displayValue, LCP: a['largest-contentful-paint'].displayValue,
        TBT: a['total-blocking-time'].displayValue, CLS: a['cumulative-layout-shift'].displayValue, SI: a['speed-index'].displayValue,
      });
    }
    // report the median run by performance score, plus the range
    results.sort((x, y) => x.performance - y.performance);
    const row = { ...results[Math.floor(results.length / 2)], runs, performanceRange: `${results[0].performance}–${results[results.length - 1].performance}` };
    summary.push(row);
    console.log(JSON.stringify(row));
  }
}
writeFileSync(`${outDir}/summary.json`, JSON.stringify({ base, lighthouse: '12.8.2', chrome, runAt: new Date().toISOString(), results: summary }, null, 2));
