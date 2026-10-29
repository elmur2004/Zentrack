// Copies the exact self-hosted font files the site uses from the official Fontsource
// packages (Google Fonts builds) into public/fonts, together with their OFL licences.
// Run: npm run fonts
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'public', 'fonts');
mkdirSync(out, { recursive: true });

const files = [
  ['@fontsource-variable/saira/files/saira-latin-wght-normal.woff2', 'saira-latin-wght.woff2'],
  ['@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2', 'ibm-plex-sans-arabic-arabic-400.woff2'],
  ['@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2', 'ibm-plex-sans-arabic-arabic-600.woff2'],
  ['@fontsource-variable/saira/LICENSE', 'LICENSE-Saira-OFL.txt'],
  ['@fontsource/ibm-plex-sans-arabic/LICENSE', 'LICENSE-IBM-Plex-Sans-Arabic-OFL.txt'],
];

for (const [from, to] of files) {
  const src = join(root, 'node_modules', from);
  if (!existsSync(src)) {
    console.error(`Missing ${src}. Run npm install first.`);
    process.exit(1);
  }
  copyFileSync(src, join(out, to));
  console.log(`copied ${to}`);
}
