import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  workOrderStatusIdSchema,
  workOrderStatusTenantIdSchema,
} from '../schemas/work-order-status-schema';

export type GetWorkOrderStatusByIdInput = { id: number; tenantId: string };

export function validateGetWorkOrderStatusById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetWorkOrderStatusByIdInput> {
  const idResult = workOrderStatusIdSchema.safeParse(id);
  const tenantIdResult = workOrderStatusTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Work order status ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
