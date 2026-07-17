import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { wardTenantIdSchema } from '../schemas/ward-schema';

export function validateGetWards(tenantId: unknown): ValidationResult<string> {
  const result = wardTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
