import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assignUserRolesSchema, type AssignUserRolesInput } from '../schemas/user-role-schema';
import {
  uniqueRoleIds,
  validateActiveRoles,
  validateActiveStaff,
} from './user-role-validator-utils';

export type AssignRolesParams = {
  userId: string;
  tenantId: string;
  assignedBy: string;
  payload: AssignUserRolesInput;
};

export async function validateAssignRoles(
  userId: unknown,
  tenantId: string,
  assignedBy: string,
  payload: unknown
): Promise<ValidationResult<AssignRolesParams>> {
  const staffResult = await validateActiveStaff(userId, tenantId);

  if (!staffResult.success) {
    return staffResult;
  }

  const payloadResult = assignUserRolesSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const roleIds = uniqueRoleIds(payloadResult.data.roleIds);
  const activeRolesResult = await validateActiveRoles(roleIds, tenantId);

  if (!activeRolesResult.success) {
    return activeRolesResult;
  }

  return {
    success: true,
    data: {
      userId: staffResult.data.userId,
      tenantId: staffResult.data.tenantId,
      assignedBy,
      payload: {
        roleIds: activeRolesResult.data.map((role) => role.id),
      },
    },
  };
}
