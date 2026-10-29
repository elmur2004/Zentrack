import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.next-review/**',
    // Local data: embedded databases, test outboxes and the dashboard test server's build copy.
    '.data/**',
    '.checkpoints/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'private-source/extracted/**',
    'test-results/**',
    'playwright-report/**',
    'docs/screenshots/**',
  ]),
]);
