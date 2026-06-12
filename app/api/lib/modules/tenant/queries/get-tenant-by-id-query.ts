import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../repository/tenant-repository';
import type { Tenant } from '../schemas/tenant-schema';
import { validateTenantMemberAccess } from '../validator/tenant-access-validator';

export async function getTenantByIdQuery(
  id: unknown,
  userId: string
): Promise<SingleQueryResult<Tenant>> {
  const validationResult = await validateTenantMemberAccess(id, userId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const tenant = await tenantRepository.getTenantById(validationResult.data.id);

  if (!tenant) {
    return {
      success: false,
      errors: ['Tenant not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: tenant };
}
