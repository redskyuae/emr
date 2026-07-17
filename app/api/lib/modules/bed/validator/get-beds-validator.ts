import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { bedTenantIdSchema } from '../schemas/bed-schema';

export function validateGetBeds(tenantId: unknown): ValidationResult<string> {
  const result = bedTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
