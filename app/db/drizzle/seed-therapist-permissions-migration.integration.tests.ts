import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { permission as permissionTable } from '@/app/db/schema/permission';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-therapist-permission-migration-test';
const therapistPermissionNames = [
  'appointment:reassign-therapist',
  'therapist-skill:create',
  'therapist-skill:delete',
  'therapist-skill:read',
  'therapist-skill:update',
  'therapist:create',
  'therapist:deactivate',
  'therapist:read',
  'therapist:reactivate',
  'therapist:update',
];

async function executeMigration() {
  const migration = await readFile(
    new URL('./0063_seed_therapist_permissions.sql', import.meta.url),
    'utf8'
  );

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

describe('0063 Therapist permissions migration', () => {
  it('should backfill Therapist and Tenant Admin permissions idempotently', async () => {
    await seedOrganization(tenantId);
    await db.insert(permissionTable).values([
      {
        module: 'appointments',
        resource: 'appointment',
        action: 'read',
        name: 'appointment:read',
        description: 'View Appointments.',
      },
      {
        module: 'patient-management',
        resource: 'patient',
        action: 'read',
        name: 'patient:read',
        description: 'View Patients.',
      },
      {
        module: 'clinical-masters',
        resource: 'treatment',
        action: 'read',
        name: 'treatment:read',
        description: 'View Treatments.',
      },
    ]);
    const systemRoles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const tenantAdminRole = systemRoles.find((role) => role.code === 'TENANT_ADMIN');
    const therapistRole = systemRoles.find((role) => role.code === 'THERAPIST');

    if (!tenantAdminRole || !therapistRole) {
      throw new Error('Required migration test roles were not created');
    }

    await executeMigration();
    await executeMigration();

    const tenantAdminPermissions = await rolePermissionRepository.getAssignedPermissionsByRole(
      tenantAdminRole.id,
      tenantId
    );
    const therapistPermissions = await rolePermissionRepository.getAssignedPermissionsByRole(
      therapistRole.id,
      tenantId
    );

    expect(tenantAdminPermissions.map(({ name }) => name).sort()).toEqual(
      therapistPermissionNames.toSorted()
    );
    expect(therapistPermissions.map(({ name }) => name).sort()).toEqual([
      'appointment:read',
      'patient:read',
      'therapist-skill:read',
      'therapist:read',
      'treatment:read',
    ]);
  });
});
