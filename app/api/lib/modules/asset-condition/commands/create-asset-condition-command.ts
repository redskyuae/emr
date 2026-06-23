import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetConditionRepository } from '../repository/asset-condition-repository';
import type { AssetCondition } from '../schemas/asset-condition-schema';
import { getAssetConditionUniqueConstraintErrors } from '../validator/asset-condition-uniqueness-validator';
import { validateCreateAssetCondition } from '../validator/create-asset-condition-validator';

export async function createAssetConditionCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AssetCondition>> {
  const validationResult = await validateCreateAssetCondition(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const assetConditionData = { ...validationResult.data, tenantId };

  try {
    const createdAssetCondition =
      await assetConditionRepository.createAssetCondition(assetConditionData);
    return { success: true, data: createdAssetCondition };
  } catch (error) {
    const constraintErrors = getAssetConditionUniqueConstraintErrors(error, assetConditionData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
