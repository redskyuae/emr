import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetStatusRepository } from '../repository/asset-status-repository';
import type { AssetStatus } from '../schemas/asset-status-schema';
import { getAssetStatusUniqueConstraintErrors } from '../validator/asset-status-uniqueness-validator';
import { validateCreateAssetStatus } from '../validator/create-asset-status-validator';

export async function createAssetStatusCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AssetStatus>> {
  const validationResult = await validateCreateAssetStatus(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const assetStatusData = { ...validationResult.data, tenantId };

  try {
    const createdAssetStatus = await assetStatusRepository.createAssetStatus(assetStatusData);
    return { success: true, data: createdAssetStatus };
  } catch (error) {
    const constraintErrors = getAssetStatusUniqueConstraintErrors(error, assetStatusData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
