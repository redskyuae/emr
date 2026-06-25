import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';
import type { Asset } from '../schemas/asset-schema';
import { getAssetSerialNumberUniqueConstraintErrors } from '../validator/asset-serial-number-validator';
import { validateUpdateAsset } from '../validator/update-asset-validator';

export async function updateAssetCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Asset>> {
  const validationResult = await validateUpdateAsset(id, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const assetData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAsset = await assetRepository.updateAsset(validationResult.data.id, assetData);

    if (!updatedAsset) {
      return { success: false, errors: ['Asset not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: updatedAsset };
  } catch (error) {
    const constraintErrors = getAssetSerialNumberUniqueConstraintErrors(error, assetData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
