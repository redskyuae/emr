import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { userRoleRepository } from '../repository/user-role-repository';
import type { AssignedRole } from '../schemas/user-role-schema';
import { validateActiveStaff } from '../validator/user-role-validator-utils';

export async function getUserRolesQuery(
  userId: unknown,
  tenantId: string
): Promise<ListQueryResult<AssignedRole>> {
  const validationResult = await validateActiveStaff(userId, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const roles = await userRoleRepository.getAssignedRolesByUser(
    validationResult.data.userId,
    validationResult.data.tenantId
  );

  return { success: true, data: roles, total: roles.length };
}
