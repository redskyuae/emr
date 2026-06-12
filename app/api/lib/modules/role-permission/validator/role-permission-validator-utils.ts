import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roleRepository } from '../../role/repository/role-repository';
import { roleIdSchema } from '../../role/schemas/role-schema';
import type { Role } from '../../role/schemas/role-schema';
import { rolePermissionRepository } from '../repository/role-permission-repository';

export type RolePermissionRoleParams = {
  roleId: number;
  tenantId: string;
  role: Role;
};

export async function validateRolePermissionRole(
  roleId: unknown,
  tenantId: string
): Promise<ValidationResult<RolePermissionRoleParams>> {
  const roleIdResult = roleIdSchema.safeParse(roleId);

  if (!roleIdResult.success) {
    return { success: false, errors: formatValidationErrors(roleIdResult.error) };
  }

  const existingRole = await roleRepository.getRoleById(roleIdResult.data, tenantId);

  if (!existingRole) {
    return {
      success: false,
      errors: ['Role not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return {
    success: true,
    data: {
      roleId: roleIdResult.data,
      tenantId,
      role: existingRole,
    },
  };
}

export function uniquePermissionIds(permissionIds: number[]) {
  return Array.from(new Set(permissionIds));
}

export async function validateActivePermissions(
  permissionIds: number[]
): Promise<ValidationResult<number[]>> {
  const activePermissions = await rolePermissionRepository.getActivePermissionsByIds(permissionIds);
  const activePermissionIds = new Set(activePermissions.map((permission) => permission.id));
  const invalidPermissionIds = permissionIds.filter(
    (permissionId) => !activePermissionIds.has(permissionId)
  );

  if (invalidPermissionIds.length > 0) {
    return {
      success: false,
      errors: [`Permission IDs are invalid: ${invalidPermissionIds.join(', ')}.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  return { success: true, data: permissionIds };
}
