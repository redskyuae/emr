import type { CommandResult } from '@/app/api/lib/utils/types';
import { userRoleRepository } from '../repository/user-role-repository';
import type { AssignedRole } from '../schemas/user-role-schema';
import { validateAssignRoles } from '../validator/assign-roles-validator';

export async function assignRolesCommand(
  userId: unknown,
  tenantId: string,
  assignedBy: string,
  payload: unknown
): Promise<CommandResult<AssignedRole[]>> {
  const validationResult = await validateAssignRoles(userId, tenantId, assignedBy, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const roles = await userRoleRepository.assignRoles(
    validationResult.data.userId,
    validationResult.data.tenantId,
    validationResult.data.payload.roleIds,
    validationResult.data.assignedBy
  );

  return { success: true, data: roles };
}
