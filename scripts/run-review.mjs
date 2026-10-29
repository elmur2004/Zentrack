// Starts the PRIVATE review build (withheld records, draft articles, conditional modules).
// Usage: npm run dev:review   → http://localhost:3100/en/review
// Uses a separate dist directory (.next-review). Never deploy this build.
import { spawn } from 'node:child_process';

const mode = process.argv[2] ?? 'dev';
const env = { ...process.env, ZENTRAC_REVIEW: '1', FORM_MODE: process.env.FORM_MODE || 'preview' };
const args = mode === 'dev' ? ['next', 'dev', '-p', '3100'] : ['next', mode];
const child = spawn('npx', args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
