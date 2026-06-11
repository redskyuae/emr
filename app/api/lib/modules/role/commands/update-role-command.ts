import type { CommandResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { Role } from '../schemas/role-schema';
import { getRoleUniqueConstraintErrors } from '../validator/role-uniqueness-validator';
import { validateUpdateRole } from '../validator/update-role-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

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
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedRole };
  } catch (error) {
    const constraintErrors = getRoleUniqueConstraintErrors(error, {
      name: validationResult.data.payload.name,
    });

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
