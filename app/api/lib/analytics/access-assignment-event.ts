// Removing one Role or Permission Assignment returns the removed row, not what is left, so the
// remaining count is read after the response is sent. The ids are used for that read only and are
// never sent.

import {
  analyticsActorFromSession,
  recordServerEventAfterLookup,
} from '@/app/api/lib/analytics/server-analytics';
import { getRolePermissionsQuery } from '@/app/api/lib/modules/role-permission/queries/get-role-permissions-query';
import { getUserRolesQuery } from '@/app/api/lib/modules/user-role/queries/get-user-roles-query';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';

/** `role_permissions_changed` after a Permission Assignment is removed from a Role. */
export function recordRolePermissionRemoved(
  tenantSession: TenantSession,
  request: Request,
  roleId: number
) {
  recordServerEventAfterLookup(
    analyticsActorFromSession(tenantSession, request),
    'role_permissions_changed',
    async () => {
      const permissions = await getRolePermissionsQuery(roleId, tenantSession.tenantId);

      return permissions.success ? { permission_count: permissions.data.length } : null;
    }
  );
}

/** `staff_roles_changed` after a Role Assignment is removed from a Staff member. */
export function recordStaffRoleRemoved(
  tenantSession: TenantSession,
  request: Request,
  userId: string
) {
  recordServerEventAfterLookup(
    analyticsActorFromSession(tenantSession, request),
    'staff_roles_changed',
    async () => {
      const roles = await getUserRolesQuery(userId, tenantSession.tenantId);

      return roles.success ? { role_count: roles.data.length } : null;
    }
  );
}
