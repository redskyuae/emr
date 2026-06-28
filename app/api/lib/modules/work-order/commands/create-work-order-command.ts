import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderRepository } from '../repository/work-order-repository';
import type { WorkOrder } from '../schemas/work-order-schema';
import { validateCreateWorkOrder } from '../validator/create-work-order-validator';

function invalidReferenceErrors(
  references: Array<'asset' | 'type' | 'priority' | 'status'>,
  input: { assetId: number; typeId: number; priorityId: number; statusId: number }
) {
  const messages = {
    asset: `Asset ${input.assetId} is Invalid.`,
    type: `Work order type ${input.typeId} is Invalid.`,
    priority: `Work order priority ${input.priorityId} is Invalid.`,
    status: `Work order status ${input.statusId} is Invalid.`,
  };

  return references.map((reference) => messages[reference]);
}

function isWorkOrderCodeConflict(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const pgError = error as Record<string, unknown>;
  return pgError.code === '23505' && pgError.constraint === 'work_order_tenant_code_idx';
}

export async function createWorkOrderCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<WorkOrder>> {
  const validationResult = await validateCreateWorkOrder(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const data = { ...validationResult.data, tenantId };

  try {
    const result = await workOrderRepository.createWorkOrder(data);

    if (!result.success) {
      return {
        success: false,
        errors: invalidReferenceErrors(result.invalidReferences, data),
        status: StatusCodes.CONFLICT,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    if (isWorkOrderCodeConflict(error)) {
      return {
        success: false,
        errors: ['Work order code already exists.'],
        status: StatusCodes.CONFLICT,
      };
    }

    throw error;
  }
}
