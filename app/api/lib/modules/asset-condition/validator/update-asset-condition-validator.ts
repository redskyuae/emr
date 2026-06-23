import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAssetConditionInput,
  updateAssetConditionSchema,
  assetConditionIdSchema,
} from '../schemas/asset-condition-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assetConditionRepository } from '../repository/asset-condition-repository';
import { validateAssetConditionUniqueness } from './asset-condition-uniqueness-validator';

export type UpdateAssetConditionParams = {
  id: number;
  payload: UpdateAssetConditionInput;
};

export async function validateUpdateAssetCondition(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAssetConditionParams>> {
  const idResult = assetConditionIdSchema.safeParse(id);
  const payloadResult = updateAssetConditionSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset condition ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAssetCondition = await assetConditionRepository.getAssetConditionById(
    idResult.data,
    tenantId
  );

  if (!existingAssetCondition) {
    return {
      success: false,
      errors: ['Asset condition not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAssetConditionUniqueness({
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
      payload: payloadResult.data,
    },
  };
}
