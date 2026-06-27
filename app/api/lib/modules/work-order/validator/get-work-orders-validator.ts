import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { workOrderTenantIdSchema } from '../schemas/work-order-schema';

export function validateGetWorkOrders(tenantId: unknown): ValidationResult<string> {
  const result = workOrderTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
