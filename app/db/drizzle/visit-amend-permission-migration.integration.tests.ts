import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-visit-amend-permission-migration-test';

async function executeMigration() {
  const migration = await readFile(
    new URL('./0075_visit_amend_permission.sql', import.meta.url),
    'utf8'
  );

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      await db.execute(sql.raw(statement));
    }
  }
}

describe('0075 Visit amend permission migration', () => {
  it('should backfill visit:amend for the Tenant Admin system role idempotently', async () => {
    await seedOrganization(tenantId);
    const roles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const tenantAdminRole = roles.find(({ code }) => code === 'TENANT_ADMIN');
    const doctorRole = roles.find(({ code }) => code !== 'TENANT_ADMIN');
    if (!tenantAdminRole || !doctorRole) throw new Error('System roles were not created');

    await executeMigration();
    await executeMigration();

    const [adminPermissions, otherPermissions] = await Promise.all([
      rolePermissionRepository.getAssignedPermissionsByRole(tenantAdminRole.id, tenantId),
      rolePermissionRepository.getAssignedPermissionsByRole(doctorRole.id, tenantId),
    ]);

    expect(adminPermissions.map(({ name }) => name)).toEqual(['visit:amend']);
    expect(otherPermissions.map(({ name }) => name)).not.toContain('visit:amend');
  });
});
