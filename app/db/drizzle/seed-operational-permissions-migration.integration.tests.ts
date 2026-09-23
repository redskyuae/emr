import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { permissionSeedData } from '@/app/api/lib/modules/permission/seed-data';
import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-operational-permission-migration-test';
const operationalModules = new Set([
  'doctor-scheduling',
  'appointments',
  'room-masters',
  'room-management',
  'asset-management',
  'asset-management-masters',
]);

async function executeMigration() {
  const migration = await readFile(
    new URL('./0056_seed_operational_permissions.sql', import.meta.url),
    'utf8'
  );

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

describe('0056 operational permissions migration', () => {
  it('should backfill new permissions for existing Tenant Admin system roles idempotently', async () => {
    await seedOrganization(tenantId);
    const systemRoles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const customRole = await roleRepository.createRole(tenantId, {
      name: 'Facilities Manager',
      code: 'FACILITIES_MANAGER',
    });

    const tenantAdminRole = systemRoles.find((role) => role.code === 'TENANT_ADMIN');
    if (!tenantAdminRole || !customRole) {
      throw new Error('Required migration test roles were not created');
    }

    await executeMigration();
    await executeMigration();

    const expectedPermissionNames = permissionSeedData
      .filter(
        ({ module, resource }) =>
          operationalModules.has(module) && resource !== 'patient-treatment-plan'
      )
      .map(({ name }) => name)
      .sort();
    const tenantAdminPermissions = await rolePermissionRepository.getAssignedPermissionsByRole(
      tenantAdminRole.id,
      tenantId
    );
    const customRolePermissions = await rolePermissionRepository.getAssignedPermissionsByRole(
      customRole.id,
      tenantId
    );

    expect(expectedPermissionNames).toHaveLength(48);
    expect(tenantAdminPermissions.map(({ name }) => name).sort()).toEqual(
      expectedPermissionNames
    );
    expect(customRolePermissions).toEqual([]);
  });
});
