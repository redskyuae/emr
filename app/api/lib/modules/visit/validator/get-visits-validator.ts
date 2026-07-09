import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitListParamsSchema, type VisitListParams } from '../schemas/visit-schema';

export function validateGetVisits(params: unknown): ValidationResult<VisitListParams> {
  const result = visitListParamsSchema.safeParse(params);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
