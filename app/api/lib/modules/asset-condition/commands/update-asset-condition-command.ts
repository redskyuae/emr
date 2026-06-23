import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetConditionRepository } from '../repository/asset-condition-repository';
import type { AssetCondition } from '../schemas/asset-condition-schema';
import { getAssetConditionUniqueConstraintErrors } from '../validator/asset-condition-uniqueness-validator';
import { validateUpdateAssetCondition } from '../validator/update-asset-condition-validator';

export async function updateAssetConditionCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AssetCondition>> {
  const validationResult = await validateUpdateAssetCondition(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const assetConditionData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAssetCondition = await assetConditionRepository.updateAssetCondition(
      validatedId,
      assetConditionData
    );

    if (!updatedAssetCondition) {
      return {
        success: false,
        errors: ['Asset condition not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAssetCondition };
  } catch (error) {
    const constraintErrors = getAssetConditionUniqueConstraintErrors(error, assetConditionData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
