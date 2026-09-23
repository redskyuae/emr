const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to migrate the integration test database.');
}

const migration = Bun.spawn(['./node_modules/.bin/drizzle-kit', 'migrate'], {
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  stderr: 'inherit',
  stdout: 'inherit',
});

process.exitCode = await migration.exited;
