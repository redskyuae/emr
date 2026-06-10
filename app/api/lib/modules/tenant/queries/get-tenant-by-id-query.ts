import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../repository/tenant-repository';
import type { Tenant } from '../schemas/tenant-schema';
import { validateTenantMemberAccess } from '../validator/tenant-access-validator';

const NOT_FOUND_STATUS = 404;

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
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: tenant };
}
