import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-therapist-schedule-permission-migration-test';

async function executePermissionStatements() {
  const migration = await readFile(new URL('./0064_lame_tombstone.sql', import.meta.url), 'utf8');
  const permissionSection = migration.split('-- therapist-schedule-permissions')[1];
  if (!permissionSection) throw new Error('Therapist Schedule permission migration is missing');
  for (const statement of permissionSection.split('--> statement-breakpoint')) {
    if (statement.trim()) await db.execute(sql.raw(statement));
  }
}

describe('0064 Therapist Schedule permissions migration', () => {
  it('should backfill Tenant Admin permissions idempotently', async () => {
    await seedOrganization(tenantId);
    const roles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const tenantAdminRole = roles.find(({ code }) => code === 'TENANT_ADMIN');
    if (!tenantAdminRole) throw new Error('Tenant Admin role was not created');

    await executePermissionStatements();
    await executePermissionStatements();

    const permissions = await rolePermissionRepository.getAssignedPermissionsByRole(
      tenantAdminRole.id,
      tenantId
    );
    expect(permissions.map(({ name }) => name).sort()).toEqual([
      'therapist-schedule:create',
      'therapist-schedule:read',
      'therapist-schedule:update',
    ]);
  });
});
