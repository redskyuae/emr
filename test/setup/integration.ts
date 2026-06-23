import { beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is required for integration tests. Run test:db:migrate first.'
  );
}

const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, '').toLowerCase();

if (!databaseName.includes('test')) {
  throw new Error(`Refusing to run integration tests against non-test database: ${databaseName}`);
}

process.env.DATABASE_URL = testDatabaseUrl;

const TABLES_TO_TRUNCATE = [
  'user_role',
  'staff_profile',
  'role_permission',
  'permission',
  'role',
  'appointment_cancelled_reason',
  'appointment_reason',
  'appointment_status',
  'appointment_type',
  'appointment_mode',
  'state',
  'country',
  'religion',
  'nationality',
  'language',
  'todo',
  'invitation',
  'member',
  'organization',
  'verification',
  'account',
  'session',
  'user',
];

beforeEach(async () => {
  const { db } = await import('@/app/db');
  await db.execute(
    sql.raw(
      `TRUNCATE TABLE ${TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
    )
  );
});
