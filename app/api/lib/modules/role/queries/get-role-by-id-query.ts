import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { RoleWithStats } from '../schemas/role-schema';
import { validateGetRoleById } from '../validator/get-role-by-id-validator';

export async function getRoleByIdQuery(
  id: unknown,
  tenantId: string
): Promise<SingleQueryResult<RoleWithStats>> {
  const validationResult = await validateGetRoleById(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const role = await roleRepository.getRoleByIdWithStats(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!role) {
    return {
      success: false,
      errors: ['Role not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: role };
}
