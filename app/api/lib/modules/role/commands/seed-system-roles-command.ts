import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roleRepository } from '../repository/role-repository';
import { roleTenantIdSchema, type Role } from '../schemas/role-schema';

export async function seedSystemRolesCommand(tenantId: unknown): Promise<CommandResult<Role[]>> {
  const tenantIdResult = roleTenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  const roles = await roleRepository.seedSystemRolesForTenant(tenantIdResult.data);

  return { success: true, data: roles };
}
