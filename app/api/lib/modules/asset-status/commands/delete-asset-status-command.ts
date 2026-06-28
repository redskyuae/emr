import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetStatusRepository } from '../repository/asset-status-repository';
import type { AssetStatus } from '../schemas/asset-status-schema';
import { validateDeleteAssetStatus } from '../validator/delete-asset-status-validator';

export async function deleteAssetStatusCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AssetStatus>> {
  const validationResult = validateDeleteAssetStatus(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAssetStatus = await assetStatusRepository.deleteAssetStatus(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAssetStatus) {
    return {
      success: false,
      errors: ['Asset status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAssetStatus };
}
