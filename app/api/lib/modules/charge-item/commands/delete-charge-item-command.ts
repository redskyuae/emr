import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { chargeItemRepository } from '../repository/charge-item-repository';
import type { ChargeItem } from '../schemas/charge-item-schema';
import { validateDeleteChargeItem } from '../validator/delete-charge-item-validator';

export async function deleteChargeItemCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<ChargeItem>> {
  const validationResult = validateDeleteChargeItem(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedChargeItem = await chargeItemRepository.deleteChargeItem(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedChargeItem) {
    return {
      success: false,
      errors: ['Charge item not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedChargeItem };
}
