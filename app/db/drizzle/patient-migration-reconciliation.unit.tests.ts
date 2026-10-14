import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const reconciledPatientColumns = [
  'title',
  'race',
  'ethnic_group',
  'photo_url',
  'patient_identification_category',
  'passport_number',
  'uid',
  'is_vip',
  'sms_consent',
  'is_medical_tourist',
  'emergency_contact_gender',
];

async function readMigration() {
  return readFile(new URL('./0067_brave_wendell_rand.sql', import.meta.url), 'utf8');
}

describe('Patient migration reconciliation', () => {
  it('should tolerate the Emirates ID index already being absent', async () => {
    const migration = await readMigration();

    expect(migration).toContain('DROP INDEX IF EXISTS "patient_tenant_emirates_id_idx"');
  });

  it('should tolerate Patient columns already deployed by the old branch history', async () => {
    const migration = await readMigration();

    for (const column of reconciledPatientColumns) {
      expect(migration).toContain(`ADD COLUMN IF NOT EXISTS "${column}"`);
    }
  });
});
