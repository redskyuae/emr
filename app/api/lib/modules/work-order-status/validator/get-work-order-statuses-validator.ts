import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { workOrderStatusTenantIdSchema } from '../schemas/work-order-status-schema';

export function validateGetWorkOrderStatuses(tenantId: unknown): ValidationResult<string> {
  const result = workOrderStatusTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
