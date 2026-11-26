import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '@/app/db';
import { permission as permissionTable } from '@/app/db/schema/permission';
import { rolePermission as rolePermissionTable } from '@/app/db/schema/role-permission';
import type { Role } from '../../role/schemas/role-schema';
import type { PermissionAssignment } from '../schemas/role-permission-schema';

const assignedPermissionColumns = {
  id: permissionTable.id,
  name: permissionTable.name,
  action: permissionTable.action,
  module: permissionTable.module,
  resource: permissionTable.resource,
  description: permissionTable.description,
};

const permissionAssignmentColumns = {
  id: rolePermissionTable.id,
  roleId: rolePermissionTable.roleId,
  tenantId: rolePermissionTable.tenantId,
  createdOn: rolePermissionTable.createdOn,
  permissionId: rolePermissionTable.permissionId,
};

const TENANT_ADMIN_DEFAULT_PERMISSIONS = 'ALL';

// Every System Role keeps the Dashboard it had before `dashboard:read` existed.
const DASHBOARD_PERMISSION = 'dashboard:read';

const DEFAULT_PERMISSION_NAMES_BY_SYSTEM_ROLE = {
  NURSE: [DASHBOARD_PERMISSION],
  // A Doctor works Patients, Appointments, today's Visits, Previous Visits and Reports. Their
  // sidebar hides Book Appointment, Doctors and the Masters for the Doctor Role, while the
  // Permissions behind them stay for the lookups their screens make. Visit amend and every
  // delete except Visit Documents stay with the Tenant Admin.
  DOCTOR: [
    DASHBOARD_PERMISSION,
    'appointment-mode:read',
    'appointment-type:read',
    'appointment-status:read',
    'appointment-reason:read',
    'appointment-cancelled-reason:read',
    'language:read',
    'nationality:read',
    'religion:read',
    'country:read',
    'state:read',
    'specialty:read',
    'doctor:read',
    'patient:read',
    'patient:create',
    'patient:update',
    'patient-chart:read',
    'patient-timeline:read',
    'appointment:read',
    'appointment:create',
    'appointment:cancel',
    'appointment:reschedule',
    'appointment:export',
    'doctor-slot:read',
    'visit:read',
    'visit:create',
    'visit:update',
    'visit:start',
    'visit:complete',
    'visit:cancel',
    'previous-visit:read',
    'visit-document:read',
    'visit-document:upload',
    'visit-document:delete',
    'visit-diagnosis:read',
    'visit-diagnosis:update',
    'report:read',
    'visit-type:read',
    'admit-source:read',
    'clinical-note:read',
    'clinical-note:create',
    'clinical-note:update',
    'clinical-note:sign',
    'vital-sign:read',
    'vital-sign:create',
    'vital-sign:update',
    'allergy:read',
    'allergy:create',
    'allergy:update',
    'problem:read',
    'problem:create',
    'problem:update',
    'medication:read',
    'medication:create',
    'medication:update',
    'diagnosis-code:read',
    'ayurveda-diagnosis-code:read',
    'allergen:read',
    'clinical-note-type:read',
    'treatment:read',
    'patient-treatment-plan:read',
    'patient-treatment-plan:assign',
    'patient-treatment-plan:update',
  ],
  // A Therapist keeps the Appointment actions that were open to them before they had their
  // own Permissions.
  THERAPIST: [
    DASHBOARD_PERMISSION,
    'appointment:read',
    'appointment:cancel',
    'appointment:reschedule',
    'appointment:export',
    'doctor-slot:read',
    'patient:read',
    'patient-chart:read',
    'patient-timeline:read',
    'treatment:read',
    'therapist:read',
    'therapist-skill:read',
  ],
  LAB_TECH: [DASHBOARD_PERMISSION],
  PHARMACIST: [DASHBOARD_PERMISSION],
  RECEPTIONIST: [DASHBOARD_PERMISSION],
  BILLING_STAFF: [DASHBOARD_PERMISSION],
  TENANT_ADMIN: TENANT_ADMIN_DEFAULT_PERMISSIONS,
} as const;

function orderAssignedPermissions() {
  return [
    asc(permissionTable.module),
    asc(permissionTable.resource),
    asc(permissionTable.action),
    asc(permissionTable.id),
  ];
}

async function getAssignedPermissionsByRole(roleId: number, tenantId: string) {
  return db
    .select(assignedPermissionColumns)
    .from(rolePermissionTable)
    .innerJoin(permissionTable, eq(rolePermissionTable.permissionId, permissionTable.id))
    .where(
      and(
        eq(rolePermissionTable.roleId, roleId),
        eq(rolePermissionTable.tenantId, tenantId),
        eq(permissionTable.isActive, true)
      )
    )
    .orderBy(...orderAssignedPermissions());
}

async function getActivePermissionsByIds(permissionIds: number[]) {
  if (permissionIds.length === 0) {
    return [];
  }

  return db
    .select(assignedPermissionColumns)
    .from(permissionTable)
    .where(and(inArray(permissionTable.id, permissionIds), eq(permissionTable.isActive, true)))
    .orderBy(...orderAssignedPermissions());
}

async function getPermissionAssignment(
  roleId: number,
  permissionId: number,
  tenantId: string
): Promise<PermissionAssignment | undefined> {
  const [assignment] = await db
    .select(permissionAssignmentColumns)
    .from(rolePermissionTable)
    .where(
      and(
        eq(rolePermissionTable.roleId, roleId),
        eq(rolePermissionTable.permissionId, permissionId),
        eq(rolePermissionTable.tenantId, tenantId)
      )
    )
    .limit(1);

  return assignment;
}

async function assignPermissions(roleId: number, tenantId: string, permissionIds: number[]) {
  await db
    .insert(rolePermissionTable)
    .values(permissionIds.map((permissionId) => ({ roleId, permissionId, tenantId })))
    .onConflictDoNothing({
      target: [rolePermissionTable.roleId, rolePermissionTable.permissionId],
    });

  return getAssignedPermissionsByRole(roleId, tenantId);
}

async function setPermissions(roleId: number, tenantId: string, permissionIds: number[]) {
  return db.transaction(async (tx) => {
    await tx
      .delete(rolePermissionTable)
      .where(
        and(eq(rolePermissionTable.roleId, roleId), eq(rolePermissionTable.tenantId, tenantId))
      );

    if (permissionIds.length > 0) {
      await tx
        .insert(rolePermissionTable)
        .values(permissionIds.map((permissionId) => ({ roleId, permissionId, tenantId })))
        .onConflictDoNothing({
          target: [rolePermissionTable.roleId, rolePermissionTable.permissionId],
        });
    }

    return tx
      .select(assignedPermissionColumns)
      .from(rolePermissionTable)
      .innerJoin(permissionTable, eq(rolePermissionTable.permissionId, permissionTable.id))
      .where(
        and(
          eq(rolePermissionTable.roleId, roleId),
          eq(rolePermissionTable.tenantId, tenantId),
          eq(permissionTable.isActive, true)
        )
      )
      .orderBy(...orderAssignedPermissions());
  });
}

async function removePermission(
  roleId: number,
  permissionId: number,
  tenantId: string
): Promise<PermissionAssignment | undefined> {
  const [assignment] = await db
    .delete(rolePermissionTable)
    .where(
      and(
        eq(rolePermissionTable.roleId, roleId),
        eq(rolePermissionTable.permissionId, permissionId),
        eq(rolePermissionTable.tenantId, tenantId)
      )
    )
    .returning(permissionAssignmentColumns);

  return assignment;
}

async function getActivePermissionRows() {
  return db
    .select({ id: permissionTable.id, name: permissionTable.name })
    .from(permissionTable)
    .where(eq(permissionTable.isActive, true));
}

async function seedDefaultPermissionsForSystemRoles(tenantId: string, roles: Role[]) {
  const activePermissions = await getActivePermissionRows();
  const activePermissionIds = activePermissions.map((permission) => permission.id);
  const permissionIdByName = new Map(
    activePermissions.map((permission) => [permission.name, permission.id])
  );
  const missingPermissionNames = new Set<string>();
  const assignments: (typeof rolePermissionTable.$inferInsert)[] = [];

  for (const role of roles) {
    const defaultPermissionNames =
      DEFAULT_PERMISSION_NAMES_BY_SYSTEM_ROLE[
        role.code as keyof typeof DEFAULT_PERMISSION_NAMES_BY_SYSTEM_ROLE
      ];

    if (!defaultPermissionNames) {
      continue;
    }

    const permissionIds =
      defaultPermissionNames === TENANT_ADMIN_DEFAULT_PERMISSIONS
        ? activePermissionIds
        : defaultPermissionNames.flatMap((permissionName) => {
            const permissionId = permissionIdByName.get(permissionName);

            if (!permissionId) {
              missingPermissionNames.add(permissionName);
              return [];
            }

            return [permissionId];
          });

    assignments.push(
      ...permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
        tenantId,
      }))
    );
  }

  if (missingPermissionNames.size > 0) {
    throw new Error(
      `Default Permissions missing from Permission Catalogue: ${Array.from(
        missingPermissionNames
      ).join(', ')}`
    );
  }

  if (assignments.length === 0) {
    return;
  }

  await db
    .insert(rolePermissionTable)
    .values(assignments)
    .onConflictDoNothing({
      target: [rolePermissionTable.roleId, rolePermissionTable.permissionId],
    });
}

export const rolePermissionRepository = {
  setPermissions,
  removePermission,
  assignPermissions,
  getPermissionAssignment,
  getActivePermissionsByIds,
  getAssignedPermissionsByRole,
  seedDefaultPermissionsForSystemRoles,
};
