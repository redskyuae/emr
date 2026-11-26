import { readFile } from 'node:fs/promises';

import { inArray, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { permissionRepository } from '@/app/api/lib/modules/permission/repository/permission-repository';
import { permissionSeedData } from '@/app/api/lib/modules/permission/seed-data';
import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { permission as permissionTable } from '@/app/db/schema/permission';
import { seedOrganization } from '@/test/helpers';

const existingTenantId = 'tenant-feature-permission-existing-test';
const onboardedTenantId = 'tenant-feature-permission-onboarded-test';

const featurePermissionNames = [
  'dashboard:read',
  'doctor-slot:read',
  'patient-chart:read',
  'patient-timeline:read',
  'appointment:cancel',
  'appointment:reschedule',
  'appointment:export',
  'previous-visit:read',
  'visit-document:read',
  'visit-document:upload',
  'visit-document:delete',
  'visit-diagnosis:read',
  'visit-diagnosis:update',
  'report:read',
];

const FEATURE_MIGRATION = '0085_seed_feature_permissions.sql';
const RESTORE_MIGRATION = '0086_restore_feature_permission_access.sql';

async function executeMigration(fileName: string) {
  const migration = await readFile(new URL(`./${fileName}`, import.meta.url), 'utf8');

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

// 0086 completes 0085, so a fresh database runs both in order.
async function executeMigrations() {
  await executeMigration(FEATURE_MIGRATION);
  await executeMigration(RESTORE_MIGRATION);
}

async function onboardTenant(tenantId: string) {
  await seedOrganization(tenantId);
  const roles = await roleRepository.seedSystemRolesForTenant(tenantId);
  await rolePermissionRepository.seedDefaultPermissionsForSystemRoles(tenantId, roles);

  return roles;
}

async function getAssignedNames(roleId: number, tenantId: string) {
  const assigned = await rolePermissionRepository.getAssignedPermissionsByRole(roleId, tenantId);

  return assigned.map(({ name }) => name).sort();
}

async function getPermissionIds(names: string[]) {
  const rows = await db
    .select({ id: permissionTable.id })
    .from(permissionTable)
    .where(inArray(permissionTable.name, names));

  return rows.map(({ id }) => id);
}

async function createCustomRole(code: string, permissionNames: string[]) {
  const role = await roleRepository.createRole(existingTenantId, {
    code,
    name: `Custom ${code}`,
    description: undefined,
  });

  if (!role) {
    throw new Error(`${code} role was not created`);
  }

  await rolePermissionRepository.assignPermissions(
    role.id,
    existingTenantId,
    await getPermissionIds(permissionNames)
  );

  return role;
}

// An existing tenant was onboarded before these Permissions existed, so they are dropped from
// the catalogue (and, by cascade, from every Role) before the migration runs.
async function arrangeExistingTenant() {
  await permissionRepository.seedPermissionCatalogue();
  const systemRoles = await onboardTenant(existingTenantId);
  const frontDesk = await createCustomRole('FRONT_DESK', [
    'visit:read',
    'visit:create',
    'appointment:read',
  ]);
  const clinician = await createCustomRole('CLINICIAN', [
    'visit:read',
    'visit:update',
    'patient:read',
    'appointment:create',
  ]);
  const retired = await createCustomRole('RETIRED', ['visit:read', 'appointment:create']);
  await roleRepository.deleteRole(retired.id, existingTenantId);

  await db.delete(permissionTable).where(inArray(permissionTable.name, featurePermissionNames));

  return { systemRoles, frontDesk, clinician, retired };
}

describe('0085 and 0086 feature permissions migrations', () => {
  it('should add the feature Permissions to the catalogue as onboarding seeds them', async () => {
    await arrangeExistingTenant();

    await executeMigrations();
    await executeMigrations();

    const rows = await db
      .select({
        name: permissionTable.name,
        module: permissionTable.module,
        action: permissionTable.action,
        resource: permissionTable.resource,
        description: permissionTable.description,
      })
      .from(permissionTable)
      .where(inArray(permissionTable.name, featurePermissionNames));
    const seeded = permissionSeedData
      .filter(({ name }) => featurePermissionNames.includes(name))
      .map(({ name, module, action, resource, description }) => ({
        name,
        module,
        action,
        resource,
        description,
      }));

    expect(seeded).toHaveLength(featurePermissionNames.length);
    expect(rows).toHaveLength(featurePermissionNames.length);
    expect(rows).toEqual(expect.arrayContaining(seeded));
  });

  it('should give existing System Roles the same Permissions a new onboarding gives', async () => {
    const { systemRoles } = await arrangeExistingTenant();

    await executeMigrations();
    await executeMigrations();

    const onboardedRoles = await onboardTenant(onboardedTenantId);

    for (const existingRole of systemRoles) {
      const onboardedRole = onboardedRoles.find(({ code }) => code === existingRole.code);

      expect(onboardedRole, existingRole.code).toBeDefined();
      expect(await getAssignedNames(existingRole.id, existingTenantId), existingRole.code).toEqual(
        await getAssignedNames(onboardedRole!.id, onboardedTenantId)
      );
    }

    const tenantAdmin = systemRoles.find(({ code }) => code === 'TENANT_ADMIN')!;

    expect(await getAssignedNames(tenantAdmin.id, existingTenantId)).toEqual(
      expect.arrayContaining(featurePermissionNames)
    );
  });

  it('should grant custom Roles the Permissions that now guard what they could already reach', async () => {
    const { frontDesk, clinician, retired } = await arrangeExistingTenant();

    await executeMigrations();

    const [frontDeskNames, clinicianNames, retiredNames] = await Promise.all([
      getAssignedNames(frontDesk.id, existingTenantId),
      getAssignedNames(clinician.id, existingTenantId),
      getAssignedNames(retired.id, existingTenantId),
    ]);

    expect(frontDeskNames).toEqual(
      [
        'appointment:cancel',
        'appointment:export',
        'appointment:read',
        'appointment:reschedule',
        'dashboard:read',
        'doctor-slot:read',
        'patient-chart:read',
        'previous-visit:read',
        'report:read',
        'visit-diagnosis:read',
        'visit-document:delete',
        'visit-document:read',
        'visit-document:upload',
        'visit:create',
        'visit:read',
      ].sort()
    );
    expect(clinicianNames).toEqual(
      [
        'appointment:cancel',
        'appointment:create',
        'appointment:reschedule',
        'dashboard:read',
        'doctor-slot:read',
        'patient-chart:read',
        'patient-timeline:read',
        'patient:read',
        'previous-visit:read',
        'report:read',
        'visit-diagnosis:read',
        'visit-diagnosis:update',
        'visit-document:delete',
        'visit-document:read',
        'visit-document:upload',
        'visit:read',
        'visit:update',
      ].sort()
    );
    expect(retiredNames).toEqual(['appointment:create', 'visit:read']);
  });

  it('should restore the wider access on a database that already applied 0085', async () => {
    const { systemRoles, frontDesk } = await arrangeExistingTenant();
    const therapist = systemRoles.find(({ code }) => code === 'THERAPIST')!;
    const restored = [
      'appointment:cancel',
      'appointment:reschedule',
      'doctor-slot:read',
      'visit-document:delete',
    ];

    await executeMigration(FEATURE_MIGRATION);

    expect(await getAssignedNames(frontDesk.id, existingTenantId)).not.toEqual(
      expect.arrayContaining(restored)
    );

    await executeMigration(RESTORE_MIGRATION);
    await executeMigration(RESTORE_MIGRATION);

    expect(await getAssignedNames(frontDesk.id, existingTenantId)).toEqual(
      expect.arrayContaining(restored)
    );
    expect(await getAssignedNames(therapist.id, existingTenantId)).toEqual(
      expect.arrayContaining(['appointment:cancel', 'appointment:reschedule', 'doctor-slot:read'])
    );
  });
});
