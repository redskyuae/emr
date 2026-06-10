import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { tenantRepository } from '../repository/tenant-repository';
import { tenantIdSchema } from '../schemas/tenant-schema';

const FORBIDDEN_STATUS = 403;
const NOT_FOUND_STATUS = 404;

type TenantAccess = {
  id: string;
  userId: string;
};

async function validateTenantAccess(
  id: unknown,
  userId: string,
  access: 'member' | 'owner'
): Promise<ValidationResult<TenantAccess>> {
  const idResult = tenantIdSchema.safeParse(id);

  if (!idResult.success) {
    return { success: false, errors: formatValidationErrors(idResult.error) };
  }

  const existingTenant = await tenantRepository.getTenantById(idResult.data);

  if (!existingTenant) {
    return {
      success: false,
      errors: ['Tenant not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const hasAccess =
    access === 'owner'
      ? await tenantRepository.isTenantOwner(idResult.data, userId)
      : await tenantRepository.isTenantMember(idResult.data, userId);

  if (!hasAccess) {
    return {
      success: false,
      errors: [access === 'owner' ? 'Tenant owner access required' : 'Tenant access required'],
      status: FORBIDDEN_STATUS,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      userId,
    },
  };
}

export function validateTenantMemberAccess(id: unknown, userId: string) {
  return validateTenantAccess(id, userId, 'member');
}

export function validateTenantOwnerAccess(id: unknown, userId: string) {
  return validateTenantAccess(id, userId, 'owner');
}
