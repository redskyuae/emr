import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import {
  workOrderStatusIdSchema,
  workOrderStatusTenantIdSchema,
} from '../schemas/work-order-status-schema';
import { validateSystemWorkOrderStatusDelete } from './work-order-status-protection-validator';

export type DeleteWorkOrderStatusInput = { id: number; tenantId: string };

export async function validateDeleteWorkOrderStatus(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<DeleteWorkOrderStatusInput>> {
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

  const existingWorkOrderStatus = await workOrderStatusRepository.getWorkOrderStatusById(
    idResult.data,
    tenantIdResult.data
  );

  if (!existingWorkOrderStatus) {
    return {
      success: false,
      errors: ['Work order status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const protectionResult = validateSystemWorkOrderStatusDelete(existingWorkOrderStatus);

  if (!protectionResult.success) {
    return protectionResult;
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
