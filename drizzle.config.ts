import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './app/db/drizzle',
  // Colocated Vitest suites are not schema modules and must not be imported by Drizzle Kit.
  schema: './app/db/schema/!(*.tests).ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
