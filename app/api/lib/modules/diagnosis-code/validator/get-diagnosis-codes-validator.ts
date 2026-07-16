import type { ValidationResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeTenantIdSchema } from '../schemas/diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetDiagnosisCodes(tenantId: unknown): ValidationResult<string> {
  const result = diagnosisCodeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
