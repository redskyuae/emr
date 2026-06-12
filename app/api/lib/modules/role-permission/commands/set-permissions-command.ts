import type { CommandResult } from '@/app/api/lib/utils/types';
import { rolePermissionRepository } from '../repository/role-permission-repository';
import type { AssignedPermission } from '../schemas/role-permission-schema';
import { validateSetPermissions } from '../validator/set-permissions-validator';

export async function setPermissionsCommand(
  roleId: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AssignedPermission[]>> {
  const validationResult = await validateSetPermissions(roleId, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const permissions = await rolePermissionRepository.setPermissions(
    validationResult.data.roleId,
    validationResult.data.tenantId,
    validationResult.data.payload.permissionIds
  );

  return { success: true, data: permissions };
}
