import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { workOrderPriorityTenantIdSchema } from '../schemas/work-order-priority-schema';

export function validateGetWorkOrderPriorities(tenantId: unknown): ValidationResult<string> {
  const result = workOrderPriorityTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
