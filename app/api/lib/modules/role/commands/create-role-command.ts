import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { RoleWithStats } from '../schemas/role-schema';
import { getRoleUniqueConstraintErrors } from '../validator/role-uniqueness-validator';
import { validateCreateRole } from '../validator/create-role-validator';

export async function createRoleCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<RoleWithStats>> {
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
    const createdRoleWithStats = await roleRepository.getRoleByIdWithStats(
      createdRole.id,
      validationResult.data.tenantId
    );

    return {
      success: true,
      data: createdRoleWithStats ?? {
        ...createdRole,
        assignedStaffCount: 0,
        permissionAssignmentCount: 0,
      },
    };
  } catch (error) {
    const constraintErrors = getRoleUniqueConstraintErrors(error, validationResult.data.payload);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
