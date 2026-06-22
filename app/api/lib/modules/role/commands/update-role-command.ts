import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { RoleWithStats } from '../schemas/role-schema';
import { getRoleUniqueConstraintErrors } from '../validator/role-uniqueness-validator';
import { validateUpdateRole } from '../validator/update-role-validator';

export async function updateRoleCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<RoleWithStats>> {
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

    const updatedRoleWithStats = await roleRepository.getRoleByIdWithStats(
      updatedRole.id,
      validationResult.data.tenantId
    );

    return {
      success: true,
      data: updatedRoleWithStats ?? {
        ...updatedRole,
        assignedStaffCount: 0,
        permissionAssignmentCount: 0,
      },
    };
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
