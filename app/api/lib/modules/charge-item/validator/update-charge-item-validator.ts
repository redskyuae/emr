import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { chargeItemRepository } from '../repository/charge-item-repository';
import {
  chargeItemIdSchema,
  updateChargeItemSchema,
  type UpdateChargeItemInput,
} from '../schemas/charge-item-schema';
import { validateChargeItemUniqueness } from './charge-item-uniqueness-validator';

export type UpdateChargeItemParams = {
  id: number;
  payload: UpdateChargeItemInput;
};

export async function validateUpdateChargeItem(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateChargeItemParams>> {
  const idResult = chargeItemIdSchema.safeParse(id);
  const payloadResult = updateChargeItemSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Charge item ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingChargeItem = await chargeItemRepository.getChargeItemById(idResult.data, tenantId);

  if (!existingChargeItem) {
    return {
      success: false,
      errors: ['Charge item not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateChargeItemUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: {
        ...payloadResult.data,
        isActive: payloadResult.data.isActive ?? existingChargeItem.isActive,
      },
    },
  };
}
