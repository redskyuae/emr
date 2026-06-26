import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  workOrderTypeIdSchema,
  workOrderTypeTenantIdSchema,
} from '../schemas/work-order-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetWorkOrderTypeByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetWorkOrderTypeById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetWorkOrderTypeByIdInput> {
  const idResult = workOrderTypeIdSchema.safeParse(id);
  const tenantIdResult = workOrderTypeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Work order type ${String(id)} is Invalid.`);
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
