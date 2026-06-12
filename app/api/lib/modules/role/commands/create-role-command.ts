import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { Role } from '../schemas/role-schema';
import { getRoleUniqueConstraintErrors } from '../validator/role-uniqueness-validator';
import { validateCreateRole } from '../validator/create-role-validator';

export async function createRoleCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Role>> {
  const validationResult = await validateCreateRole(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdRole = await roleRepository.createRole(
      validationResult.data.tenantId,
      validationResult.data.payload
    );

    return { success: true, data: createdRole };
  } catch (error) {
    const constraintErrors = getRoleUniqueConstraintErrors(error, validationResult.data.payload);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
