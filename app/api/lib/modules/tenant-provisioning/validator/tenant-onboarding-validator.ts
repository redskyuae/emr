import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { tenantIdSchema, type Tenant } from '../../tenant/schemas/tenant-schema';

export async function validateTenantOnboarding(
  tenantId: unknown
): Promise<ValidationResult<Tenant>> {
  const result = tenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const tenant = await tenantRepository.getTenantById(result.data);

  if (!tenant) {
    return { success: false, errors: ['Tenant not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: tenant };
}
