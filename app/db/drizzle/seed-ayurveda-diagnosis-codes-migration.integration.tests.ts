import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from '@/app/api/lib/modules/ayurveda-diagnosis-code/repository/ayurveda-diagnosis-code-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantA = 'tenant-ayurveda-seed-migration-a';
const tenantB = 'tenant-ayurveda-seed-migration-b';

async function executeMigration() {
  const migration = await readFile(
    new URL('./0079_seed_ayurveda_diagnosis_codes.sql', import.meta.url),
    'utf8'
  );

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) await db.execute(sql.raw(statement));
  }
}

const listCodes = (tenantId: string) =>
  ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({ tenantId, limit: 100 });

describe('0079 Ayurveda Diagnosis Code seed migration', () => {
  it('should seed the 34 unmapped starter codes for every existing Tenant idempotently', async () => {
    await seedOrganization(tenantA);
    await seedOrganization(tenantB);

    await executeMigration();
    await executeMigration();

    const [tenantACodes, tenantBCodes] = await Promise.all([listCodes(tenantA), listCodes(tenantB)]);

    expect(tenantACodes.total).toBe(34);
    expect(tenantBCodes.total).toBe(34);
    expect(tenantACodes.data).toContainEqual(
      expect.objectContaining({
        code: 'AYU-JVARA',
        name: 'Jvara',
        englishName: 'Fever',
        category: 'General',
        icdDiagnosisCode: null,
      })
    );
    expect(tenantACodes.data).toContainEqual(
      expect.objectContaining({ code: 'AYU-KASHTARTAVA', category: "Women's health" })
    );
  });

  it('should keep a Tenant code and not restore a code the Tenant deleted', async () => {
    await seedOrganization(tenantA);
    await ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode({
      tenantId: tenantA,
      code: 'AYU-JVARA',
      name: 'Jvara (clinic wording)',
      category: undefined,
      englishName: undefined,
      icdDiagnosisCodeId: null,
    });
    const removed = await ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode({
      tenantId: tenantA,
      code: 'AYU-KASA',
      name: 'Kasa',
      category: undefined,
      englishName: undefined,
      icdDiagnosisCodeId: null,
    });
    if (!removed) throw new Error('Ayurveda Diagnosis Code was not created');
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(removed.id, tenantA);

    await executeMigration();

    const { data, total } = await listCodes(tenantA);

    expect(total).toBe(33);
    expect(data.filter(({ code }) => code === 'AYU-JVARA')).toEqual([
      expect.objectContaining({ name: 'Jvara (clinic wording)' }),
    ]);
    expect(data.map(({ code }) => code)).not.toContain('AYU-KASA');
  });
});
