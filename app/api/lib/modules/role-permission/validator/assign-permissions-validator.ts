import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  assignRolePermissionsSchema,
  type AssignRolePermissionsInput,
} from '../schemas/role-permission-schema';
import {
  uniquePermissionIds,
  validateActivePermissions,
  validateRolePermissionRole,
} from './role-permission-validator-utils';

export type AssignPermissionsParams = {
  roleId: number;
  tenantId: string;
  payload: AssignRolePermissionsInput;
};

export async function validateAssignPermissions(
  roleId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<AssignPermissionsParams>> {
  const roleResult = await validateRolePermissionRole(roleId, tenantId);

  if (!roleResult.success) {
    return roleResult;
  }

  const payloadResult = assignRolePermissionsSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const permissionIds = uniquePermissionIds(payloadResult.data.permissionIds);
  const activePermissionsResult = await validateActivePermissions(permissionIds);

  if (!activePermissionsResult.success) {
    return activePermissionsResult;
  }

  return {
    success: true,
    data: {
      roleId: roleResult.data.roleId,
      tenantId: roleResult.data.tenantId,
      payload: {
        permissionIds: activePermissionsResult.data,
      },
    },
  };
}
