import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roleRepository } from '../repository/role-repository';
import { roleIdSchema, type Role } from '../schemas/role-schema';

const NOT_FOUND_STATUS = 404;

export async function validateGetRoleById(
  id: unknown,
  tenantId: string
): Promise<ValidationResult<Role>> {
  const idResult = roleIdSchema.safeParse(id);

  if (!idResult.success) {
    return { success: false, errors: formatValidationErrors(idResult.error) };
  }

  const existingRole = await roleRepository.getRoleById(idResult.data, tenantId);

  if (!existingRole) {
    return {
      success: false,
      errors: ['Role not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: existingRole };
}
