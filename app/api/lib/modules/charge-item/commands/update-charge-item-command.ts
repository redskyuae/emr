import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { chargeItemRepository } from '../repository/charge-item-repository';
import type { ChargeItem } from '../schemas/charge-item-schema';
import { validateUpdateChargeItem } from '../validator/update-charge-item-validator';
import { getChargeItemUniqueConstraintErrors } from '../validator/charge-item-uniqueness-validator';

export async function updateChargeItemCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<ChargeItem>> {
  const validationResult = await validateUpdateChargeItem(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const chargeItemData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedChargeItem = await chargeItemRepository.updateChargeItem(
      validationResult.data.id,
      chargeItemData
    );

    if (!updatedChargeItem) {
      return {
        success: false,
        errors: ['Charge item not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedChargeItem };
  } catch (error) {
    const constraintErrors = getChargeItemUniqueConstraintErrors(error, chargeItemData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
