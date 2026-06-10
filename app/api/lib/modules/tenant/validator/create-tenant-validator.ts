import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createTenantSchema,
  createTenantSlug,
  tenantSlugSchema,
  type ValidatedCreateTenantInput,
} from '../schemas/tenant-schema';
import { validateTenantUniqueness } from './tenant-uniqueness-validator';

export async function validateCreateTenant(
  payload: unknown
): Promise<ValidationResult<ValidatedCreateTenantInput>> {
  const result = createTenantSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const slug = createTenantSlug(result.data.name);
  const slugResult = tenantSlugSchema.safeParse(slug);

  if (!slugResult.success) {
    return { success: false, errors: formatValidationErrors(slugResult.error) };
  }

  const uniquenessResult = await validateTenantUniqueness({
    name: result.data.name,
    slug: slugResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      ...result.data,
      slug: slugResult.data,
    },
  };
}
