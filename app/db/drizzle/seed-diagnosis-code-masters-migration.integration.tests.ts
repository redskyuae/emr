import { readFile } from 'node:fs/promises';

import { and, eq, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { DEFAULT_AYURVEDA_DIAGNOSIS_CODES } from '@/app/api/lib/modules/ayurveda-diagnosis-code/seed-data';
import { ayurvedaDiagnosisCodeRepository } from '@/app/api/lib/modules/ayurveda-diagnosis-code/repository/ayurveda-diagnosis-code-repository';
import { diagnosisCodeRepository } from '@/app/api/lib/modules/diagnosis-code/repository/diagnosis-code-repository';
import { permissionSeedData } from '@/app/api/lib/modules/permission/seed-data';
import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { ayurvedaDiagnosisCode as ayurvedaDiagnosisCodeTable } from '@/app/db/schema/ayurveda-diagnosis-code';
import { diagnosisCode as diagnosisCodeTable } from '@/app/db/schema/diagnosis-code';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-diagnosis-code-migration-test';

async function executeMigration() {
  const migration = await readFile(
    new URL('./0071_seed-diagnosis-code-masters.sql', import.meta.url),
    'utf8'
  );

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

const rowsFor = (table: typeof diagnosisCodeTable | typeof ayurvedaDiagnosisCodeTable) =>
  db.select().from(table).where(eq(table.tenantId, tenantId));

describe('0071 diagnosis code masters migration', () => {
  it('should add every default Ayurveda Diagnosis Code to an existing Tenant idempotently', async () => {
    await seedOrganization(tenantId);

    await executeMigration();
    await executeMigration();

    const rows = await rowsFor(ayurvedaDiagnosisCodeTable);

    expect(rows.map(({ code, title, category }) => ({ code, title, category }))).toEqual(
      expect.arrayContaining([...DEFAULT_AYURVEDA_DIAGNOSIS_CODES])
    );
    expect(rows).toHaveLength(DEFAULT_AYURVEDA_DIAGNOSIS_CODES.length);
    expect(rows.every((row) => row.isActive)).toBe(true);
  });

  it('should add missing Diagnosis Codes without replacing a Tenant edit', async () => {
    await seedOrganization(tenantId);
    await diagnosisCodeRepository.createDiagnosisCode({
      tenantId,
      code: 'i10',
      title: 'Tenant hypertension title',
      category: undefined,
    });

    await executeMigration();

    const rows = await rowsFor(diagnosisCodeTable);

    expect(rows).toHaveLength(20);
    expect(rows.find((row) => row.code.toLowerCase() === 'i10')?.title).toBe(
      'Tenant hypertension title'
    );
  });

  it('should not resurrect defaults a Tenant has removed', async () => {
    await seedOrganization(tenantId);
    const removed = await ayurvedaDiagnosisCodeRepository.createAyurvedaDiagnosisCode({
      tenantId,
      code: 'AYU-JVARA',
      title: 'Jvara (Fever)',
      category: undefined,
    });
    await ayurvedaDiagnosisCodeRepository.deleteAyurvedaDiagnosisCode(removed.id, tenantId);

    await executeMigration();

    const active = await db
      .select()
      .from(ayurvedaDiagnosisCodeTable)
      .where(
        and(
          eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
          eq(ayurvedaDiagnosisCodeTable.code, 'AYU-JVARA'),
          eq(ayurvedaDiagnosisCodeTable.isDeleted, false)
        )
      );

    expect(active).toEqual([]);
  });

  it('should grant Ayurveda Diagnosis Code permissions to Tenant Admin roles only', async () => {
    await seedOrganization(tenantId);
    const systemRoles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const tenantAdminRole = systemRoles.find((role) => role.code === 'TENANT_ADMIN');
    const doctorRole = systemRoles.find((role) => role.code === 'DOCTOR');

    if (!tenantAdminRole || !doctorRole) {
      throw new Error('Required migration test roles were not created');
    }

    await executeMigration();
    await executeMigration();

    const expected = permissionSeedData
      .filter(({ resource }) => resource === 'ayurveda-diagnosis-code')
      .map(({ name }) => name)
      .sort();
    const granted = async (roleId: number) =>
      (await rolePermissionRepository.getAssignedPermissionsByRole(roleId, tenantId))
        .map(({ name }) => name)
        .filter((name) => name.startsWith('ayurveda-diagnosis-code:'))
        .sort();

    expect(expected).toHaveLength(4);
    await expect(granted(tenantAdminRole.id)).resolves.toEqual(expected);
    await expect(granted(doctorRole.id)).resolves.toEqual([]);
  });
});
