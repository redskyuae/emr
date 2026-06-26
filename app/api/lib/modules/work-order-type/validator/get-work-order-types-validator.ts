import type { ValidationResult } from '@/app/api/lib/utils/types';
import { workOrderTypeTenantIdSchema } from '../schemas/work-order-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetWorkOrderTypes(tenantId: unknown): ValidationResult<string> {
  const result = workOrderTypeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
