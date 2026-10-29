/**
 * npm run admin:create-owner -- --email owner@company.example --name "Full Name"
 * Zentrac's first owner (owner decision, 28 Oct 2026):
 *   npm run admin:create-owner -- --email mark@zentrack.com --name "Mark Mofreh"
 *
 * Creates the FIRST dashboard owner from the server console (someone with server access).
 * - Refuses when an active owner already exists (further people are invited from the dashboard).
 * - The password is typed interactively and never echoed, logged or stored in plain text.
 *   Non-interactive provisioning may pass it once via ADMIN_OWNER_PASSWORD (unset it afterwards).
 * - Better Auth hashes the password; no default or shared password exists anywhere.
 */
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { closeDb, databaseConfigured, getDb } from '../src/server/db/client';
import { isDomainError } from '../src/server/admin/errors';
import { bootstrapOwner, PASSWORD_MAX, PASSWORD_MIN } from '../src/server/admin/team';

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? (process.argv[i + 1] ?? '') : '';
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    let muted = false;
    const out = new Writable({
      write(chunk, _enc, cb) {
        if (!muted) process.stdout.write(chunk);
        cb();
      },
    });
    const rl = createInterface({ input: process.stdin, output: out, terminal: true });
    process.stdout.write(question);
    muted = true;
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const email = arg('email');
  const name = arg('name');
  if (!email || !name) {
    console.error('Usage: npm run admin:create-owner -- --email <verified owner email> --name "<full name>"');
    process.exit(2);
  }
  if (!databaseConfigured()) {
    console.error('✗ No database configured. Set DATABASE_URL (or DATABASE_DRIVER=pglite for local use).');
    process.exit(2);
  }
  let password = process.env.ADMIN_OWNER_PASSWORD ?? '';
  if (!password) {
    if (!process.stdin.isTTY) {
      console.error('✗ Run interactively to type the password, or provide ADMIN_OWNER_PASSWORD for one-off automated provisioning.');
      process.exit(2);
    }
    password = await askHidden(`Password for ${email} (${PASSWORD_MIN}-${PASSWORD_MAX} characters): `);
    const again = await askHidden('Repeat password: ');
    if (password !== again) {
      console.error('✗ The passwords do not match.');
      process.exit(2);
    }
  }
  const db = await getDb();
  try {
    await bootstrapOwner(db, { email, name, password });
  } catch (e) {
    if (isDomainError(e)) {
      const msg =
        e.code === 'already_exists'
          ? 'An active owner (or an account with this email) already exists. Invite further people from Team & permissions.'
          : e.code === 'validation'
            ? `Invalid ${String(e.details?.field ?? 'input')}. Passwords need ${PASSWORD_MIN}-${PASSWORD_MAX} characters.`
            : e.code;
      console.error(`✗ ${msg}`);
      process.exit(1);
    }
    throw e;
  } finally {
    await closeDb();
  }
  const base = (process.env.BETTER_AUTH_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  console.log(`✓ Owner account created for ${email}.`);
  console.log(`  Sign in at ${base}/en/admin/sign-in. Two-factor authentication is optional (Your account).`);
}

main().catch((e) => {
  console.error('✗ Owner creation failed:', e instanceof Error ? e.name : e);
  process.exit(1);
});
