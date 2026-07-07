import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientTenantIdSchema } from '../schemas/patient-schema';

export function validateGetPatients(tenantId: unknown): ValidationResult<string> {
  const result = patientTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true, data: result.data };
}
