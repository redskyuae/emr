import { readFile } from 'node:fs/promises';

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { admitSourceRepository } from '@/app/api/lib/modules/admit-source/repository/admit-source-repository';
import { rolePermissionRepository } from '@/app/api/lib/modules/role-permission/repository/role-permission-repository';
import { roleRepository } from '@/app/api/lib/modules/role/repository/role-repository';
import { db } from '@/app/db';
import { seedOrganization } from '@/test/helpers';

const tenantId = 'tenant-admit-source-migration-test';

async function executeMigration() {
  const migration = await readFile(
    new URL('./0071_seed_admit_sources.sql', import.meta.url),
    'utf8'
  );

  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) await db.execute(sql.raw(statement));
  }
}

describe('0071 Admit Source seed migration', () => {
  it('should backfill Tenant Admin permissions idempotently', async () => {
    await seedOrganization(tenantId);
    const roles = await roleRepository.seedSystemRolesForTenant(tenantId);
    const tenantAdminRole = roles.find(({ code }) => code === 'TENANT_ADMIN');
    if (!tenantAdminRole) throw new Error('Tenant Admin role was not created');

    await executeMigration();
    await executeMigration();

    const permissions = await rolePermissionRepository.getAssignedPermissionsByRole(
      tenantAdminRole.id,
      tenantId
    );
    expect(permissions.map(({ name }) => name).sort()).toEqual([
      'admit-source:create',
      'admit-source:delete',
      'admit-source:read',
      'admit-source:update',
    ]);
  });

  it('should seed the default Admit Sources for existing Tenants idempotently', async () => {
    await seedOrganization(tenantId);

    await executeMigration();
    await executeMigration();

    const { data, total } = await admitSourceRepository.getAdmitSources({ tenantId, limit: 20 });

    expect(total).toBe(7);
    expect(data.map(({ name }) => name)).toEqual([
      'Camp / Outreach',
      'Clinic Referral',
      'Doctor Referral',
      'Emergency',
      'Hospital Transfer',
      'Other',
      'Self / Walk-in',
    ]);
  });
});
