import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitTypeTenantIdSchema } from '../schemas/visit-type-schema';

export function validateGetVisitTypes(tenantId: unknown): ValidationResult<string> {
  const result = visitTypeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
