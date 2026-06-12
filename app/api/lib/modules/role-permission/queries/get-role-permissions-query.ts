import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { rolePermissionRepository } from '../repository/role-permission-repository';
import type { AssignedPermission } from '../schemas/role-permission-schema';
import { validateRolePermissionRole } from '../validator/role-permission-validator-utils';

export async function getRolePermissionsQuery(
  roleId: unknown,
  tenantId: string
): Promise<SingleQueryResult<AssignedPermission[]>> {
  const validationResult = await validateRolePermissionRole(roleId, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const permissions = await rolePermissionRepository.getAssignedPermissionsByRole(
    validationResult.data.roleId,
    validationResult.data.tenantId
  );

  return { success: true, data: permissions };
}
