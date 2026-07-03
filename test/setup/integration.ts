import { beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is required for integration tests. Run test:db:migrate first.'
  );
}

const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, '').toLowerCase();
const isTestDatabase = /(^test$|^test[_-]|[_-]test$|[_-]test[_-])/.test(databaseName);

if (!isTestDatabase) {
  throw new Error(`Refusing to run integration tests against non-test database: ${databaseName}`);
}

process.env.DATABASE_URL = testDatabaseUrl;

// Discover application tables at runtime rather than hard-coding a list that
// drifts from the schema (a stale name makes TRUNCATE fail; a missing one leaks
// state between tests). CASCADE follows foreign keys, so every table can be
// truncated in one statement regardless of dependency order. Drizzle's migration
// bookkeeping lives in the `drizzle` schema, so filtering to `public` leaves it
// untouched.
beforeEach(async () => {
  const { db } = await import('@/app/db');

  const result = await db.execute(sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  const tableNames = result.rows.map((row: Record<string, unknown>) => row.tablename as string);

  if (tableNames.length === 0) {
    return;
  }

  const quotedTables = tableNames.map((name: string) => `"${name}"`).join(', ');
  await db.execute(sql.raw(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`));
});
