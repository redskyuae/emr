import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';

const WORK_ORDER_PRIORITY_NAME_EXISTS = "Work order priority name '{value}' already exists.";
const WORK_ORDER_PRIORITY_CODE_EXISTS = "Work order priority code '{value}' already exists.";

type WorkOrderPriorityUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateWorkOrderPriorityUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: WorkOrderPriorityUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    workOrderPriorityRepository.findActiveByName(tenantId, name, { excludeId }),
    workOrderPriorityRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(WORK_ORDER_PRIORITY_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(WORK_ORDER_PRIORITY_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getWorkOrderPriorityUniqueConstraintErrors(
  error: unknown,
  input: Pick<WorkOrderPriorityUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'work_order_priority_tenant_name_idx') {
    return [duplicateError(WORK_ORDER_PRIORITY_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'work_order_priority_tenant_code_idx') {
    return [duplicateError(WORK_ORDER_PRIORITY_CODE_EXISTS, input.code)];
  }

  return [];
}
