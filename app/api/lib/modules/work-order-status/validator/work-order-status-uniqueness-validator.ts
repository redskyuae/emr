import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';

const WORK_ORDER_STATUS_NAME_EXISTS = "Work order status name '{value}' already exists.";
const WORK_ORDER_STATUS_CODE_EXISTS = "Work order status code '{value}' already exists.";

type WorkOrderStatusUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateWorkOrderStatusUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: WorkOrderStatusUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    workOrderStatusRepository.findActiveByName(tenantId, name, { excludeId }),
    workOrderStatusRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(WORK_ORDER_STATUS_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(WORK_ORDER_STATUS_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getWorkOrderStatusUniqueConstraintErrors(
  error: unknown,
  input: Pick<WorkOrderStatusUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'work_order_status_tenant_name_idx') {
    return [duplicateError(WORK_ORDER_STATUS_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'work_order_status_tenant_code_idx') {
    return [duplicateError(WORK_ORDER_STATUS_CODE_EXISTS, input.code)];
  }

  return [];
}
