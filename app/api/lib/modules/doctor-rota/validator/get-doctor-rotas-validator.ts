import type { ValidationResult } from '@/app/api/lib/utils/types';
import { doctorRotaTenantIdSchema } from '../schemas/doctor-rota-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetDoctorRotas(tenantId: unknown): ValidationResult<string> {
  const result = doctorRotaTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
