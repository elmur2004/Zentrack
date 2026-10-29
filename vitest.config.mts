import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: resolve(root, 'src/$1') },
      { find: /^@private\/(.*)$/, replacement: resolve(root, 'private-source/content/$1') },
      // `server-only` throws outside the React server condition; it is a no-op marker for tests.
      { find: /^server-only$/, replacement: resolve(root, 'tests/unit/server-only-stub.ts') },
    ],
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
