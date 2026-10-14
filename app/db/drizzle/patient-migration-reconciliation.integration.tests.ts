import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';

async function readMigrationStatements() {
  const migration = await readFile(
    new URL('./0067_brave_wendell_rand.sql', import.meta.url),
    'utf8'
  );

  return migration.split('--> statement-breakpoint').filter((statement) => statement.trim());
}

describe('0067 Patient migration reconciliation', () => {
  it('should apply when the old branch Patient columns already exist', async () => {
    const statements = await readMigrationStatements();

    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`
        CREATE TEMPORARY TABLE "patient" (
          "tenant_id" varchar(255) NOT NULL,
          "emirates_id" varchar(15),
          "is_deleted" boolean DEFAULT false NOT NULL,
          "title" varchar(20),
          "race" varchar(20),
          "ethnic_group" varchar(30),
          "photo_url" text,
          "patient_identification_category" varchar(60),
          "passport_number" varchar(50),
          "uid" varchar(30),
          "is_vip" boolean DEFAULT false NOT NULL,
          "sms_consent" boolean DEFAULT false NOT NULL,
          "is_medical_tourist" boolean DEFAULT false NOT NULL,
          "emergency_contact_gender" varchar(20)
        ) ON COMMIT DROP
      `));
      await tx.execute(sql.raw(`
        CREATE UNIQUE INDEX "patient_tenant_emirates_id_idx"
        ON "patient" ("tenant_id", "emirates_id")
        WHERE "is_deleted" = false AND "emirates_id" IS NOT NULL
      `));

      for (const statement of statements) {
        await tx.execute(sql.raw(statement));
      }

      await tx.execute(sql.raw(`
        INSERT INTO "patient" ("tenant_id", "emirates_id")
        VALUES ('tenant-1', '999999999999999'), ('tenant-1', '999999999999999')
      `));

      const index = await tx.execute(sql.raw(`
        SELECT indexdef
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND tablename = 'patient'
          AND indexname = 'patient_tenant_emirates_id_idx'
      `));

      expect(index.rows).toHaveLength(1);
      expect(index.rows[0]?.indexdef).toContain('784%');
    });
  });
});
