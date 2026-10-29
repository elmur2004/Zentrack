/**
 * Imported FIRST by every admin integration test: an isolated in-memory PostgreSQL (PGlite)
 * per test file, a throwaway auth secret, and no external transports.
 */
process.env.DATABASE_URL = '';
process.env.DATABASE_DRIVER = 'pglite';
process.env.PGLITE_DATA_DIR = 'memory';
process.env.BETTER_AUTH_SECRET = 'test-only-secret-for-isolated-integration-tests-0001';
process.env.BETTER_AUTH_URL = 'http://localhost:3999';
process.env.EMAIL_TRANSPORT = '';
process.env.FILE_SCAN_MODE = '';
process.env.STORAGE_DRIVER = 'database';
process.env.JOBS_SCHEDULER = 'off';
export {};
