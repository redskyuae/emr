import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { rolePermissionRepository } from '../repository/role-permission-repository';
import type { PermissionAssignment } from '../schemas/role-permission-schema';
import { validateRemovePermission } from '../validator/remove-permission-validator';

export async function removePermissionCommand(
  roleId: unknown,
  permissionId: unknown,
  tenantId: string
): Promise<CommandResult<PermissionAssignment>> {
  const validationResult = await validateRemovePermission(roleId, permissionId, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const assignment = await rolePermissionRepository.removePermission(
    validationResult.data.roleId,
    validationResult.data.permissionId,
    validationResult.data.tenantId
  );

  if (!assignment) {
    return {
      success: false,
      errors: ['Permission Assignment not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: assignment };
}
