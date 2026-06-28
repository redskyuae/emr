import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { userRoleRepository } from '../../user-role/repository/user-role-repository';
import { roleRepository } from '../repository/role-repository';
import { roleIdSchema } from '../schemas/role-schema';

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
      status: StatusCodes.NOT_FOUND,
    };
  }

  if (existingRole.isSystem) {
    return {
      success: false,
      errors: ['System roles cannot be deleted.'],
      status: StatusCodes.UNPROCESSABLE_ENTITY,
    };
  }

  const assignmentCount = await userRoleRepository.countAssignmentsByRole(idResult.data, tenantId);

  if (assignmentCount > 0) {
    return {
      success: false,
      errors: ['Role has active assignments.'],
      status: StatusCodes.UNPROCESSABLE_ENTITY,
    };
  }

  return {
    success: true,
    data: {
      tenantId,
      id: idResult.data,
    },
  };
}
