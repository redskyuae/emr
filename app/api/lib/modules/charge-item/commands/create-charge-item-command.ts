import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { chargeItemRepository } from '../repository/charge-item-repository';
import type { ChargeItem } from '../schemas/charge-item-schema';
import { validateCreateChargeItem } from '../validator/create-charge-item-validator';
import { getChargeItemUniqueConstraintErrors } from '../validator/charge-item-uniqueness-validator';

export async function createChargeItemCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<ChargeItem>> {
  const validationResult = await validateCreateChargeItem(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const chargeItemData = { ...validationResult.data, tenantId };

  try {
    const createdChargeItem = await chargeItemRepository.createChargeItem(chargeItemData);
    return { success: true, data: createdChargeItem };
  } catch (error) {
    const constraintErrors = getChargeItemUniqueConstraintErrors(error, chargeItemData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
