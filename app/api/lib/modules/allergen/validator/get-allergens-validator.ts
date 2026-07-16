import type { ValidationResult } from '@/app/api/lib/utils/types';
import { allergenTenantIdSchema } from '../schemas/allergen-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAllergens(tenantId: unknown): ValidationResult<string> {
  const result = allergenTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
