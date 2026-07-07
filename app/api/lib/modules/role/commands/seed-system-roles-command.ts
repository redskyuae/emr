import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { rolePermissionRepository } from '../../role-permission/repository/role-permission-repository';
import { SystemRoleSeedConflictError } from '../errors/system-role-seed-conflict-error';
import { roleRepository } from '../repository/role-repository';
import { roleTenantIdSchema, type Role } from '../schemas/role-schema';

export async function seedSystemRolesCommand(tenantId: unknown): Promise<CommandResult<Role[]>> {
  const tenantIdResult = roleTenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    const roles = await roleRepository.seedSystemRolesForTenant(tenantIdResult.data);
    await rolePermissionRepository.seedDefaultPermissionsForSystemRoles(tenantIdResult.data, roles);

    return { success: true, data: roles };
  } catch (error) {
    if (error instanceof SystemRoleSeedConflictError) {
      return { success: false, errors: [error.message], status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
