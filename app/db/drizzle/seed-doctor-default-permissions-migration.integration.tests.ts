import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { permissionRepository } from '@/app/api/lib/modules/permission/repository/permission-repository';
import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-doctor-permission-migration-test';
const onboardedTenantId = 'tenant-doctor-permission-onboarded-test';

async function executeMigration(fileName: string) {
  const migration = await readFile(new URL(`./${fileName}`, import.meta.url), 'utf8');

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

async function seedRoles(tenant: string) {
  await seedOrganization(tenant);
  const roles = await roleRepository.seedSystemRolesForTenant(tenant);
  const findRole = (code: string) => {
    const role = roles.find((candidate) => candidate.code === code);

    if (!role) {
      throw new Error(`${code} role was not created`);
    }

    return role;
  };

  return { roles, findRole };
}

async function getAssignedNames(roleId: number, tenant: string) {
  const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(roleId, tenant);

  return assigned.map(({ name }) => name).sort();
}

describe('0084 Doctor default permissions migration', () => {
  // 0085 adds the feature Permissions that today's onboarding also gives a Doctor.
  it('should give existing Doctor roles the onboarding defaults idempotently', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const existing = await seedRoles(tenantId);
    const onboarded = await seedRoles(onboardedTenantId);
    await rolePermissionRepository.seedDefaultPermissionsForSystemRoles(
      onboardedTenantId,
      onboarded.roles
    );

    for (const fileName of [
      '0084_seed_doctor_default_permissions.sql',
      '0084_seed_doctor_default_permissions.sql',
      '0085_seed_feature_permissions.sql',
    ]) {
      await executeMigration(fileName);
    }

    const [doctorPermissions, onboardedDoctorPermissions, nursePermissions] = await Promise.all([
      getAssignedNames(existing.findRole('DOCTOR').id, tenantId),
      getAssignedNames(onboarded.findRole('DOCTOR').id, onboardedTenantId),
      getAssignedNames(existing.findRole('NURSE').id, tenantId),
    ]);

    expect(doctorPermissions).toEqual(onboardedDoctorPermissions);
    expect(doctorPermissions).toEqual(
      expect.arrayContaining([
        'patient:read',
        'appointment:read',
        'appointment:create',
        'visit:read',
        'visit:create',
      ])
    );
    expect(doctorPermissions).not.toContain('visit:amend');
    expect(nursePermissions).toEqual(['dashboard:read']);
  });
});
