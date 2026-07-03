import { and, asc, count, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { permission as permissionTable } from '@/app/db/schema/permission';
import { rolePermission as rolePermissionTable } from '@/app/db/schema/role-permission';
import { role as roleTable } from '@/app/db/schema/role';
import { staffProfile as staffProfileTable } from '@/app/db/schema/staff-profile';
import { userRole as userRoleTable } from '@/app/db/schema/user-role';
import type {
  CreateRoleInput,
  Role,
  RoleListParams,
  RoleWithStats,
  UpdateRoleInput,
} from '../schemas/role-schema';

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
  code: roleTable.code,
  name: roleTable.name,
  isSystem: roleTable.isSystem,
  tenantId: roleTable.tenantId,
  createdOn: roleTable.createdOn,
  modifiedOn: roleTable.modifiedOn,
  description: roleTable.description,
};

type RoleRow = typeof roleTable.$inferSelect;

type RoleStats = Pick<RoleWithStats, 'assignedStaffCount' | 'permissionAssignmentCount'>;

function emptyRoleStats(): RoleStats {
  return {
    assignedStaffCount: 0,
    permissionAssignmentCount: 0,
  };
}

async function getRoleStatsById(tenantId: string, roleIds: number[]) {
  if (roleIds.length === 0) {
    return new Map<number, RoleStats>();
  }

  const [staffCounts, permissionCounts] = await Promise.all([
    db
      .select({ roleId: userRoleTable.roleId, total: count(userRoleTable.id) })
      .from(userRoleTable)
      .innerJoin(
        staffProfileTable,
        and(
          eq(userRoleTable.userId, staffProfileTable.userId),
          eq(userRoleTable.tenantId, staffProfileTable.tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .where(and(eq(userRoleTable.tenantId, tenantId), inArray(userRoleTable.roleId, roleIds)))
      .groupBy(userRoleTable.roleId),
    db
      .select({ roleId: rolePermissionTable.roleId, total: count(rolePermissionTable.id) })
      .from(rolePermissionTable)
      .innerJoin(permissionTable, eq(rolePermissionTable.permissionId, permissionTable.id))
      .where(
        and(
          eq(rolePermissionTable.tenantId, tenantId),
          inArray(rolePermissionTable.roleId, roleIds),
          eq(permissionTable.isActive, true)
        )
      )
      .groupBy(rolePermissionTable.roleId),
  ]);

  const statsByRoleId = new Map<number, RoleStats>();

  for (const roleId of roleIds) {
    statsByRoleId.set(roleId, emptyRoleStats());
  }

  for (const staffCount of staffCounts) {
    statsByRoleId.set(staffCount.roleId, {
      ...(statsByRoleId.get(staffCount.roleId) ?? emptyRoleStats()),
      assignedStaffCount: staffCount.total,
    });
  }

  for (const permissionCount of permissionCounts) {
    statsByRoleId.set(permissionCount.roleId, {
      ...(statsByRoleId.get(permissionCount.roleId) ?? emptyRoleStats()),
      permissionAssignmentCount: permissionCount.total,
    });
  }

  return statsByRoleId;
}

async function attachRoleStats(tenantId: string, roles: Role[]): Promise<RoleWithStats[]> {
  const statsByRoleId = await getRoleStatsById(
    tenantId,
    roles.map((role) => role.id)
  );

  return roles.map((role) => ({
    ...role,
    ...(statsByRoleId.get(role.id) ?? emptyRoleStats()),
  }));
}

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

async function updateRole(
  id: number,
  tenantId: string,
  data: UpdateRoleInput
): Promise<Role | undefined> {
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

async function deleteRole(id: number, tenantId: string): Promise<Role | undefined> {
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

async function getRoleById(id: number, tenantId: string): Promise<Role | undefined> {
  const [role] = await db
    .select(roleColumns)
    .from(roleTable)
    .where(
      and(eq(roleTable.id, id), eq(roleTable.tenantId, tenantId), eq(roleTable.isDeleted, false))
    )
    .limit(1);

  return role;
}

async function getRoleByIdWithStats(id: number, tenantId: string) {
  const role = await getRoleById(id, tenantId);

  if (!role) {
    return undefined;
  }

  const [roleWithStats] = await attachRoleStats(tenantId, [role]);

  return roleWithStats;
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

  return { data: await attachRoleStats(tenantId, data), total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<Role | undefined> {
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
): Promise<Role | undefined> {
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
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getRolesByIds,
  findActiveByName,
  findActiveByCode,
  getRoleByIdWithStats,
  seedSystemRolesForTenant,
};
