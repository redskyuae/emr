import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { treatmentTenantIdSchema } from '../schemas/treatment-schema';

export function validateGetTreatments(tenantId: unknown): ValidationResult<string> {
  const result = treatmentTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
