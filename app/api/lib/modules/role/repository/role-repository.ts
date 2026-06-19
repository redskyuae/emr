import { and, asc, count, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { roleTable } from '@/app/db/schema/role';
import type { CreateRoleInput, RoleListParams, UpdateRoleInput } from '../schemas/role-schema';

export const SYSTEM_ROLE_DEFINITIONS = [
  {
    name: 'Tenant Admin',
    code: 'TENANT_ADMIN',
    description: 'Full administrative access within the tenant',
  },
  {
    name: 'Doctor',
    code: 'DOCTOR',
    description: 'Clinical staff with prescribing authority',
  },
  { name: 'Nurse', code: 'NURSE', description: 'Clinical care staff' },
  {
    name: 'Receptionist',
    code: 'RECEPTIONIST',
    description: 'Front-desk and appointment management',
  },
  { name: 'Pharmacist', code: 'PHARMACIST', description: 'Medication dispensing' },
  { name: 'Lab Technician', code: 'LAB_TECH', description: 'Laboratory and diagnostics' },
  { name: 'Billing Staff', code: 'BILLING_STAFF', description: 'Billing and insurance' },
] as const;

const roleColumns = {
  id: roleTable.id,
  tenantId: roleTable.tenantId,
  name: roleTable.name,
  code: roleTable.code,
  description: roleTable.description,
  isSystem: roleTable.isSystem,
  createdOn: roleTable.createdOn,
  modifiedOn: roleTable.modifiedOn,
};

type RoleRow = typeof roleTable.$inferSelect;

async function createRole(tenantId: string, data: CreateRoleInput, isSystem = false) {
  const [createdRole] = await db
    .insert(roleTable)
    .values({
      tenantId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      isSystem,
    })
    .returning(roleColumns);

  return createdRole;
}

async function updateRole(id: number, tenantId: string, data: UpdateRoleInput) {
  const updateData: Partial<Pick<RoleRow, 'name' | 'description' | 'modifiedOn'>> = {
    modifiedOn: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  const [updatedRole] = await db
    .update(roleTable)
    .set(updateData)
    .where(
      and(eq(roleTable.id, id), eq(roleTable.tenantId, tenantId), eq(roleTable.isDeleted, false))
    )
    .returning(roleColumns);

  return updatedRole;
}

async function softDeleteRole(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedRole] = await db
    .update(roleTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(roleTable.id, id),
        eq(roleTable.tenantId, tenantId),
        eq(roleTable.isSystem, false),
        eq(roleTable.isDeleted, false)
      )
    )
    .returning(roleColumns);

  return deletedRole;
}

async function getRoleById(id: number, tenantId: string) {
  const [role] = await db
    .select(roleColumns)
    .from(roleTable)
    .where(
      and(eq(roleTable.id, id), eq(roleTable.tenantId, tenantId), eq(roleTable.isDeleted, false))
    )
    .limit(1);

  return role;
}

async function getRolesByIds(roleIds: number[], tenantId: string) {
  if (roleIds.length === 0) {
    return [];
  }

  return db
    .select(roleColumns)
    .from(roleTable)
    .where(
      and(
        eq(roleTable.tenantId, tenantId),
        eq(roleTable.isDeleted, false),
        inArray(roleTable.id, roleIds)
      )
    )
    .orderBy(asc(roleTable.name), asc(roleTable.id));
}

async function getRoles({ tenantId, page = 1, limit = 10, query }: RoleListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(ilike(roleTable.name, `%${trimmedQuery}%`), ilike(roleTable.code, `%${trimmedQuery}%`))
    : undefined;
  const whereClause = and(
    eq(roleTable.tenantId, tenantId),
    eq(roleTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(roleColumns)
      .from(roleTable)
      .where(whereClause)
      .orderBy(asc(roleTable.name), asc(roleTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(roleTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [role] = await db
    .select(roleColumns)
    .from(roleTable)
    .where(
      and(
        eq(roleTable.tenantId, tenantId),
        eq(roleTable.isDeleted, false),
        sql`lower(${roleTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(roleTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return role;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [role] = await db
    .select(roleColumns)
    .from(roleTable)
    .where(
      and(
        eq(roleTable.tenantId, tenantId),
        eq(roleTable.isDeleted, false),
        sql`lower(${roleTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(roleTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return role;
}

async function getSystemRolesForTenant(tenantId: string) {
  const codes = SYSTEM_ROLE_DEFINITIONS.map(({ code }) => code);

  return db
    .select(roleColumns)
    .from(roleTable)
    .where(
      and(
        eq(roleTable.tenantId, tenantId),
        eq(roleTable.isDeleted, false),
        inArray(roleTable.code, codes)
      )
    )
    .orderBy(asc(roleTable.id));
}

async function seedSystemRolesForTenant(tenantId: string) {
  await db
    .insert(roleTable)
    .values(
      SYSTEM_ROLE_DEFINITIONS.map((definition) => ({
        tenantId,
        name: definition.name,
        code: definition.code,
        description: definition.description,
        isSystem: true,
      }))
    )
    .onConflictDoNothing();

  return getSystemRolesForTenant(tenantId);
}

export const roleRepository = {
  createRole,
  updateRole,
  softDeleteRole,
  getRoleById,
  getRolesByIds,
  getRoles,
  findActiveByName,
  findActiveByCode,
  seedSystemRolesForTenant,
};
