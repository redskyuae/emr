import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { permissionIdSchema } from '../../permission/schemas/permission-schema';
import { rolePermissionRepository } from '../repository/role-permission-repository';
import { validateRolePermissionRole } from './role-permission-validator-utils';

export type RemovePermissionParams = {
  roleId: number;
  permissionId: number;
  tenantId: string;
};

export async function validateRemovePermission(
  roleId: unknown,
  permissionId: unknown,
  tenantId: string
): Promise<ValidationResult<RemovePermissionParams>> {
  const roleResult = await validateRolePermissionRole(roleId, tenantId);
  const permissionIdResult = permissionIdSchema.safeParse(permissionId);

  if (!roleResult.success || !permissionIdResult.success) {
    const errors: string[] = [];

    if (!roleResult.success) {
      errors.push(...roleResult.errors);
    }

    if (!permissionIdResult.success) {
      errors.push(`Permission ${String(permissionId)} is Invalid.`);
    }

    return {
      success: false,
      errors,
      status: roleResult.success ? undefined : roleResult.status,
    };
  }

  const assignment = await rolePermissionRepository.getPermissionAssignment(
    roleResult.data.roleId,
    permissionIdResult.data,
    roleResult.data.tenantId
  );

  if (!assignment) {
    return {
      success: false,
      errors: ['Permission Assignment not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return {
    success: true,
    data: {
      roleId: roleResult.data.roleId,
      permissionId: permissionIdResult.data,
      tenantId: roleResult.data.tenantId,
    },
  };
}
