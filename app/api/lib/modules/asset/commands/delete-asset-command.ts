import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';
import { validateDeleteAsset } from '../validator/delete-asset-validator';

export async function deleteAssetCommand(
  id: unknown,
  tenantId: string
): Promise<CommandResult<void>> {
  const validationResult = await validateDeleteAsset(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deleteResult = await assetRepository.deleteAsset(validationResult.data, tenantId);

  if (deleteResult.outcome === 'in-use') {
    return {
      success: false,
      errors: ['Asset cannot be deleted while it has active work orders.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (deleteResult.outcome === 'not-found') {
    return { success: false, errors: ['Asset not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: undefined };
}
