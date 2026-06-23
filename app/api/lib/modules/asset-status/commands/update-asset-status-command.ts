import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetStatusRepository } from '../repository/asset-status-repository';
import type { AssetStatus } from '../schemas/asset-status-schema';
import { getAssetStatusUniqueConstraintErrors } from '../validator/asset-status-uniqueness-validator';
import { validateUpdateAssetStatus } from '../validator/update-asset-status-validator';

export async function updateAssetStatusCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AssetStatus>> {
  const validationResult = await validateUpdateAssetStatus(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const assetStatusData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAssetStatus = await assetStatusRepository.updateAssetStatus(
      validatedId,
      assetStatusData
    );

    if (!updatedAssetStatus) {
      return {
        success: false,
        errors: ['Asset status not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAssetStatus };
  } catch (error) {
    const constraintErrors = getAssetStatusUniqueConstraintErrors(error, assetStatusData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
