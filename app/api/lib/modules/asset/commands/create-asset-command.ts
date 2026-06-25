import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';
import type { Asset } from '../schemas/asset-schema';
import { getAssetSerialNumberUniqueConstraintErrors } from '../validator/asset-serial-number-validator';
import { validateCreateAsset } from '../validator/create-asset-validator';

export async function createAssetCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Asset>> {
  const validationResult = await validateCreateAsset(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const assetData = { ...validationResult.data, tenantId };

  try {
    const createdAsset = await assetRepository.createAsset(assetData);

    if (!createdAsset) {
      return { success: false, errors: ['Asset not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: createdAsset };
  } catch (error) {
    const constraintErrors = getAssetSerialNumberUniqueConstraintErrors(error, assetData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
