import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { specialtyTenantIdSchema } from '../schemas/specialty-schema';

export function validateGetSpecialties(tenantId: unknown): ValidationResult<string> {
  const result = specialtyTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
