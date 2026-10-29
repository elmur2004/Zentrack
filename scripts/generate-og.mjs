// Generates localized Open Graph images (1200×630) from the actual logo and self-hosted fonts.
// Usage: node scripts/generate-og.mjs   → public/og/og-en.png, public/og/og-ar.png
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'public', 'og');
mkdirSync(out, { recursive: true });
const b64 = (p) => readFileSync(join(root, p)).toString('base64');
const logo = `data:image/png;base64,${b64('public/brand/zentrac-logo-horizontal-on-dark.png')}`;
const saira = `data:font/woff2;base64,${b64('public/fonts/saira-latin-wght.woff2')}`;
const plex = `data:font/woff2;base64,${b64('public/fonts/ibm-plex-sans-arabic-arabic-600.woff2')}`;

const copy = {
  en: { dir: 'ltr', eyebrow: 'Engineering and BIM Consultancy', title: 'Engineered to Be Built.', sub: 'BIM modelling · Coordination · Shop drawings' },
  ar: { dir: 'rtl', eyebrow: 'استشارات هندسية ونمذجة معلومات البناء', title: 'هندسة قابلة للتنفيذ.', sub: 'نمذجة معلومات البناء · التنسيق · المخططات التنفيذية' },
};

const html = (l) => `<!doctype html><html lang="${l}" dir="${copy[l].dir}"><head><meta charset="utf-8"><style>
@font-face{font-family:Saira;src:url(${saira}) format('woff2');font-weight:100 900}
@font-face{font-family:'Plex Arabic';src:url(${plex}) format('woff2');font-weight:600}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:radial-gradient(ellipse 70% 70% at 80% 30%,#16263b,#0b1624 70%);color:#fff;font-family:Saira,'Plex Arabic',sans-serif;overflow:hidden;position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:48px 48px}
.slash{position:absolute;top:0;inset-inline-end:0;width:420px;height:10px;background:#fa5211}
.diag{position:absolute;bottom:-60px;inset-inline-end:80px;width:180px;height:380px;background:#fa5211;transform:skewX(${l === 'ar' ? '' : '-'}32deg);opacity:.95}
.diag2{position:absolute;bottom:-60px;inset-inline-end:300px;width:60px;height:300px;border:2px solid rgba(255,255,255,.35);transform:skewX(${l === 'ar' ? '' : '-'}32deg)}
.wrap{position:absolute;inset:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
img{width:300px;height:auto}
.eyebrow{color:#ff7a45;font-weight:600;font-size:26px;letter-spacing:${l === 'ar' ? '0' : '.12em'};text-transform:${l === 'ar' ? 'none' : 'uppercase'}}
h1{font-size:${l === 'ar' ? 86 : 92}px;line-height:${l === 'ar' ? 1.3 : 1.05};font-weight:${l === 'ar' ? 700 : 600};margin-top:18px;letter-spacing:${l === 'ar' ? '0' : '-.02em'}}
.sub{color:#b4c0ce;font-size:28px;margin-top:18px}
</style></head><body><div class="grid"></div><div class="slash"></div><div class="diag2"></div><div class="diag"></div>
<div class="wrap"><img src="${logo}" alt=""><div><p class="eyebrow">${copy[l].eyebrow}</p><h1>${copy[l].title}</h1><p class="sub">${copy[l].sub}</p></div></div></body></html>`;

const browser = await chromium.launch();
for (const l of ['en', 'ar']) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html(l), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `og-${l}.png`) });
  console.log(`wrote public/og/og-${l}.png`);
  await page.close();
}
await browser.close();
