import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  workOrderPriorityIdSchema,
  workOrderPriorityTenantIdSchema,
} from '../schemas/work-order-priority-schema';

export type GetWorkOrderPriorityByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetWorkOrderPriorityById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetWorkOrderPriorityByIdInput> {
  const idResult = workOrderPriorityIdSchema.safeParse(id);
  const tenantIdResult = workOrderPriorityTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Work order priority ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
