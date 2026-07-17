import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionTypeTenantIdSchema } from '../schemas/admission-type-schema';

export function validateGetAdmissionTypes(tenantId: unknown): ValidationResult<string> {
  const result = admissionTypeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
