import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import type { Role } from '../schemas/role-schema';
import { validateGetRoleById } from '../validator/get-role-by-id-validator';

export async function getRoleByIdQuery(
  id: unknown,
  tenantId: string
): Promise<SingleQueryResult<Role>> {
  const validationResult = await validateGetRoleById(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  return { success: true, data: validationResult.data };
}
