import type { ValidationResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeTenantIdSchema } from '../schemas/ayurveda-diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAyurvedaDiagnosisCodes(tenantId: unknown): ValidationResult<string> {
  const result = ayurvedaDiagnosisCodeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
