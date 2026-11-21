import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-ayurveda-diagnosis-code-permission-migration-test';

async function executeMigration() {
  const migration = await readFile(
    new URL('./0077_ayurveda_diagnosis_code_permission.sql', import.meta.url),
    'utf8'
  );

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

describe('0077 Ayurveda Diagnosis Code permission migration', () => {
  it('should backfill the Ayurveda Diagnosis Code permissions for Tenant Admin idempotently', async () => {
    await seedOrganization(tenantId);
    const roles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const tenantAdminRole = roles.find(({ code }) => code === 'TENANT_ADMIN');
    const otherRole = roles.find(({ code }) => code !== 'TENANT_ADMIN');
    if (!tenantAdminRole || !otherRole) throw new Error('System roles were not created');

    await executeMigration();
    await executeMigration();

    const [adminPermissions, otherPermissions] = await Promise.all([
      rolePermissionRepository.getAssignedPermissionsByRole(tenantAdminRole.id, tenantId),
      rolePermissionRepository.getAssignedPermissionsByRole(otherRole.id, tenantId),
    ]);

    expect(adminPermissions.map(({ name }) => name).sort()).toEqual([
      'ayurveda-diagnosis-code:create',
      'ayurveda-diagnosis-code:delete',
      'ayurveda-diagnosis-code:read',
      'ayurveda-diagnosis-code:update',
    ]);
    expect(otherPermissions).toEqual([]);
  });
});
