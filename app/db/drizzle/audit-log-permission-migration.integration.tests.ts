import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-audit-log-permission-migration-test';

// Runs only the permission backfill statements of 0081; the table and trigger
// statements already ran when the test database was migrated.
async function executePermissionBackfill() {
  const migration = await readFile(new URL('./0081_audit_event.sql', import.meta.url), 'utf8');
  const statements = migration
    .split('--> statement-breakpoint')
    .filter((statement) => /INSERT INTO "(permission|role_permission)"/.test(statement));

  expect(statements).toHaveLength(2);

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}

describe('0081 Audit Log permission migration', () => {
  it('should backfill both Audit Log permissions for the Tenant Admin system role idempotently', async () => {
    await seedOrganization(tenantId);
    const roles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const tenantAdminRole = roles.find(({ code }) => code === 'TENANT_ADMIN');
    const otherRole = roles.find(({ code }) => code !== 'TENANT_ADMIN');
    if (!tenantAdminRole || !otherRole) throw new Error('System roles were not created');

    await executePermissionBackfill();
    await executePermissionBackfill();

    const [adminPermissions, otherPermissions] = await Promise.all([
      rolePermissionRepository.getAssignedPermissionsByRole(tenantAdminRole.id, tenantId),
      rolePermissionRepository.getAssignedPermissionsByRole(otherRole.id, tenantId),
    ]);

    expect(adminPermissions.map(({ name }) => name).sort()).toEqual([
      'audit-log:export',
      'audit-log:read',
    ]);
    expect(otherPermissions.map(({ name }) => name)).not.toContain('audit-log:read');
  });
});
