import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { workOrderTypeRepository } from '../repository/work-order-type-repository';
const WORK_ORDER_TYPE_NAME_EXISTS = "Work order type name '{value}' already exists.";
const WORK_ORDER_TYPE_CODE_EXISTS = "Work order type code '{value}' already exists.";

type WorkOrderTypeUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateWorkOrderTypeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: WorkOrderTypeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    workOrderTypeRepository.findActiveByName(tenantId, name, { excludeId }),
    workOrderTypeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(WORK_ORDER_TYPE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(WORK_ORDER_TYPE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getWorkOrderTypeUniqueConstraintErrors(
  error: unknown,
  input: Pick<WorkOrderTypeUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'work_order_type_tenant_name_idx') {
    return [duplicateError(WORK_ORDER_TYPE_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'work_order_type_tenant_code_idx') {
    return [duplicateError(WORK_ORDER_TYPE_CODE_EXISTS, input.code)];
  }

  return [];
}
