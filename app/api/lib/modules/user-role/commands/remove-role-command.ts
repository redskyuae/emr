import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { userRoleRepository } from '../repository/user-role-repository';
import type { RoleAssignment } from '../schemas/user-role-schema';
import { validateRemoveRole } from '../validator/remove-role-validator';

export async function removeRoleCommand(
  userId: unknown,
  roleId: unknown,
  tenantId: string
): Promise<CommandResult<RoleAssignment>> {
  const validationResult = await validateRemoveRole(userId, roleId, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const assignment = await userRoleRepository.removeRole(
    validationResult.data.userId,
    validationResult.data.roleId,
    validationResult.data.tenantId
  );

  if (!assignment) {
    return {
      success: false,
      errors: ['Role Assignment not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: assignment };
}
