import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  setRolePermissionsSchema,
  type SetRolePermissionsInput,
} from '../schemas/role-permission-schema';
import {
  uniquePermissionIds,
  validateActivePermissions,
  validateRolePermissionRole,
} from './role-permission-validator-utils';

export type SetPermissionsParams = {
  roleId: number;
  tenantId: string;
  payload: SetRolePermissionsInput;
};

export async function validateSetPermissions(
  roleId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<SetPermissionsParams>> {
  const roleResult = await validateRolePermissionRole(roleId, tenantId);

  if (!roleResult.success) {
    return roleResult;
  }

  const payloadResult = setRolePermissionsSchema.safeParse(payload);

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
