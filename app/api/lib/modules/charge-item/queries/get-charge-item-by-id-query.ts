import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { chargeItemRepository } from '../repository/charge-item-repository';
import type { ChargeItem } from '../schemas/charge-item-schema';
import { validateGetChargeItemById } from '../validator/get-charge-item-by-id-validator';

export async function getChargeItemByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<ChargeItem>> {
  const validationResult = validateGetChargeItemById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const chargeItem = await chargeItemRepository.getChargeItemById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!chargeItem) {
    return {
      success: false,
      errors: ['Charge item not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: chargeItem };
}
