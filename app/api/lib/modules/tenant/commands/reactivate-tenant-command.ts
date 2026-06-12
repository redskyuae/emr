import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../repository/tenant-repository';
import type { Tenant } from '../schemas/tenant-schema';
import { validateTenantOwnerAccess } from '../validator/tenant-access-validator';

export async function reactivateTenantCommand(
  id: unknown,
  userId: string
): Promise<CommandResult<Tenant>> {
  const validationResult = await validateTenantOwnerAccess(id, userId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const reactivatedTenant = await tenantRepository.setTenantActive(validationResult.data.id, true);

  if (!reactivatedTenant) {
    return {
      success: false,
      errors: ['Tenant not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: reactivatedTenant };
}
