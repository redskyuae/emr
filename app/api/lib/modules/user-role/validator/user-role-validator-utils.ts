import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roleRepository } from '../../role/repository/role-repository';
import { type Role } from '../../role/schemas/role-schema';
import { staffRepository } from '../../staff/repository/staff-repository';
import { staffUserIdSchema } from '../../staff/schemas/staff-schema';

export type UserRoleStaffParams = {
  userId: string;
  tenantId: string;
};

export function uniqueRoleIds(roleIds: number[]) {
  return Array.from(new Set(roleIds));
}

export async function validateActiveStaff(
  userId: unknown,
  tenantId: string
): Promise<ValidationResult<UserRoleStaffParams>> {
  const userIdResult = staffUserIdSchema.safeParse(userId);

  if (!userIdResult.success) {
    return { success: false, errors: formatValidationErrors(userIdResult.error) };
  }

  const existingStaff = await staffRepository.getStaffByUserId(userIdResult.data, tenantId);

  if (!existingStaff || !existingStaff.isActive) {
    return {
      success: false,
      errors: ['Staff not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return {
    success: true,
    data: {
      userId: userIdResult.data,
      tenantId,
    },
  };
}

export async function validateActiveRoles(
  roleIds: number[],
  tenantId: string
): Promise<ValidationResult<Role[]>> {
  const activeRoles = await roleRepository.getRolesByIds(roleIds, tenantId);
  const activeRoleIds = new Set(activeRoles.map((role) => role.id));
  const missingRoleIds = roleIds.filter((roleId) => !activeRoleIds.has(roleId));

  if (missingRoleIds.length > 0) {
    return {
      success: false,
      errors: [`Role not found: ${missingRoleIds.join(', ')}.`],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: activeRoles };
}
