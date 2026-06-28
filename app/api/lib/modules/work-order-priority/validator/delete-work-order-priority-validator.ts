import { StatusCodes } from 'http-status-codes';

import { workOrderRepository } from '../../work-order/repository/work-order-repository';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  workOrderPriorityIdSchema,
  workOrderPriorityTenantIdSchema,
} from '../schemas/work-order-priority-schema';

export type DeleteWorkOrderPriorityInput = {
  id: number;
  tenantId: string;
};

type WorkOrderPriorityUsageReader = Pick<typeof workOrderRepository, 'isPriorityInUse'>;

export async function validateDeleteWorkOrderPriority(
  id: unknown,
  tenantId: unknown,
  usage: WorkOrderPriorityUsageReader = workOrderRepository
): Promise<ValidationResult<DeleteWorkOrderPriorityInput>> {
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

  if (await usage.isPriorityInUse(idResult.data, tenantIdResult.data)) {
    return {
      success: false,
      errors: ['Work order priority cannot be deleted while it is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
