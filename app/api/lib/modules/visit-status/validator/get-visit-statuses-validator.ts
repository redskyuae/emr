import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitStatusTenantIdSchema } from '../schemas/visit-status-schema';

export function validateGetVisitStatuses(tenantId: unknown): ValidationResult<string> {
  const result = visitStatusTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
