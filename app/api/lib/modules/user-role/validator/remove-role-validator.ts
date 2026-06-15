import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roleRepository } from '../../role/repository/role-repository';
import { roleIdSchema } from '../../role/schemas/role-schema';
import { userRoleRepository } from '../repository/user-role-repository';
import { validateActiveStaff } from './user-role-validator-utils';

export const USER_MUST_HAVE_ROLE_MESSAGE = 'Users must have at least one role.';

export type RemoveRoleParams = {
  userId: string;
  roleId: number;
  tenantId: string;
};

export async function validateRemoveRole(
  userId: unknown,
  roleId: unknown,
  tenantId: string
): Promise<ValidationResult<RemoveRoleParams>> {
  const staffResult = await validateActiveStaff(userId, tenantId);
  const roleIdResult = roleIdSchema.safeParse(roleId);

  if (!staffResult.success || !roleIdResult.success) {
    const errors: string[] = [];

    if (!staffResult.success) {
      errors.push(...staffResult.errors);
    }

    if (!roleIdResult.success) {
      errors.push(...formatValidationErrors(roleIdResult.error));
    }

    return {
      success: false,
      errors,
      status: staffResult.success ? undefined : staffResult.status,
    };
  }

  const existingRole = await roleRepository.getRoleById(roleIdResult.data, tenantId);

  if (!existingRole) {
    return {
      success: false,
      errors: ['Role not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const assignment = await userRoleRepository.getRoleAssignment(
    staffResult.data.userId,
    roleIdResult.data,
    staffResult.data.tenantId
  );

  if (!assignment) {
    return {
      success: false,
      errors: ['Role Assignment not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const assignmentCount = await userRoleRepository.countAssignmentsByUser(
    staffResult.data.userId,
    staffResult.data.tenantId
  );

  if (assignmentCount <= 1) {
    return {
      success: false,
      errors: [USER_MUST_HAVE_ROLE_MESSAGE],
      status: StatusCodes.UNPROCESSABLE_ENTITY,
    };
  }

  return {
    success: true,
    data: {
      userId: staffResult.data.userId,
      roleId: roleIdResult.data,
      tenantId: staffResult.data.tenantId,
    },
  };
}
