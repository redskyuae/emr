import type { CommandResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { Role } from '../schemas/role-schema';
import { validateDeleteRole } from '../validator/delete-role-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteRoleCommand(
  id: unknown,
  tenantId: string
): Promise<CommandResult<Role>> {
  const validationResult = await validateDeleteRole(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedRole = await roleRepository.softDeleteRole(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedRole) {
    return {
      success: false,
      errors: ['Role not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedRole };
}
