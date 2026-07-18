import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { chargeItemRepository } from '../repository/charge-item-repository';

const CHARGE_ITEM_NAME_EXISTS = 'Charge item name {value} already exists.';
const CHARGE_ITEM_CODE_EXISTS = 'Charge item code {value} already exists.';

type ChargeItemUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateChargeItemUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: ChargeItemUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    chargeItemRepository.findActiveByName(tenantId, name, { excludeId }),
    chargeItemRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(CHARGE_ITEM_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(CHARGE_ITEM_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getChargeItemUniqueConstraintErrors(
  error: unknown,
  input: Pick<ChargeItemUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'charge_item_tenant_name_idx') {
    return [duplicateError(CHARGE_ITEM_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'charge_item_tenant_code_idx') {
    return [duplicateError(CHARGE_ITEM_CODE_EXISTS, input.code)];
  }

  return [];
}
