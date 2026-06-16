import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { createTenantSlug, tenantSlugSchema } from '../../tenant/schemas/tenant-schema';
import {
  signupSchema,
  type ValidatedTenantProvisioningInput,
} from '../schemas/tenant-provisioning-schema';
import { tenantProvisioningRepository } from '../repository/tenant-provisioning-repository';

export async function validateTenantProvisioning(
  payload: unknown
): Promise<ValidationResult<ValidatedTenantProvisioningInput>> {
  const result = signupSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const tenantSlug = createTenantSlug(result.data.tenantName);
  const slugResult = tenantSlugSchema.safeParse(tenantSlug);

  if (!slugResult.success) {
    return { success: false, errors: formatValidationErrors(slugResult.error) };
  }

  const [existingUser, existingTenantByName, existingTenantBySlug] = await Promise.all([
    tenantProvisioningRepository.findUserByEmail(result.data.ownerEmail),
    tenantRepository.findTenantByName(result.data.tenantName),
    tenantRepository.findTenantBySlug(slugResult.data),
  ]);

  const errors: string[] = [];

  if (existingUser) {
    errors.push('A user with this email already exists.');
  }

  if (existingTenantByName) {
    errors.push('A tenant with this name already exists.');
  } else if (existingTenantBySlug) {
    errors.push('A tenant with this slug already exists.');
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return {
    success: true,
    data: {
      ...result.data,
      tenantSlug: slugResult.data,
    },
  };
}
