import { StatusCodes } from 'http-status-codes';

import { workOrderRepository } from '../../work-order/repository/work-order-repository';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  workOrderTypeIdSchema,
  workOrderTypeTenantIdSchema,
} from '../schemas/work-order-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type DeleteWorkOrderTypeInput = {
  id: number;
  tenantId: string;
};

type WorkOrderTypeUsageReader = Pick<typeof workOrderRepository, 'isTypeInUse'>;

export async function validateDeleteWorkOrderType(
  id: unknown,
  tenantId: unknown,
  usage: WorkOrderTypeUsageReader = workOrderRepository
): Promise<ValidationResult<DeleteWorkOrderTypeInput>> {
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

  if (await usage.isTypeInUse(idResult.data, tenantIdResult.data)) {
    return {
      success: false,
      errors: ['Work order type cannot be deleted while it is in use.'],
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
