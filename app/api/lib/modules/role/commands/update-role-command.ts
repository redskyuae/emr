import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { Role } from '../schemas/role-schema';
import { getRoleUniqueConstraintErrors } from '../validator/role-uniqueness-validator';
import { validateUpdateRole } from '../validator/update-role-validator';

export async function updateRoleCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Role>> {
  const validationResult = await validateUpdateRole(id, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const updatedRole = await roleRepository.updateRole(
      validationResult.data.id,
      validationResult.data.tenantId,
      validationResult.data.payload
    );

    if (!updatedRole) {
      return {
        success: false,
        errors: ['Role not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedRole };
  } catch (error) {
    const constraintErrors = getRoleUniqueConstraintErrors(error, {
      name: validationResult.data.payload.name,
    });

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
