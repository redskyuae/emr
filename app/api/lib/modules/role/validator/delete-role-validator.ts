import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roleRepository } from '../repository/role-repository';
import { roleIdSchema } from '../schemas/role-schema';

const NOT_FOUND_STATUS = 404;
const UNPROCESSABLE_STATUS = 422;

export type DeleteRoleParams = {
  id: number;
  tenantId: string;
};

export async function validateDeleteRole(
  id: unknown,
  tenantId: string
): Promise<ValidationResult<DeleteRoleParams>> {
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

  if (existingRole.isSystem) {
    return {
      success: false,
      errors: ['System roles cannot be deleted.'],
      status: UNPROCESSABLE_STATUS,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId,
    },
  };
}
