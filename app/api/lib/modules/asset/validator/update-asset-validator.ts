import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assetRepository } from '../repository/asset-repository';
import { assetIdSchema, type UpdateAssetInput, updateAssetSchema } from '../schemas/asset-schema';
import { validateAssetReferences } from './asset-reference-validator';
import { validateAssetSerialNumberUniqueness } from './asset-serial-number-validator';

export type UpdateAssetParams = {
  id: number;
  payload: UpdateAssetInput;
};

export async function validateUpdateAsset(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<UpdateAssetParams>> {
  const idResult = assetIdSchema.safeParse(id);
  const payloadResult = updateAssetSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAsset = await assetRepository.getAssetById(idResult.data, tenantId);

  if (!existingAsset) {
    return {
      success: false,
      errors: ['Asset not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const referenceResult = await validateAssetReferences(payloadResult.data, tenantId);

  if (!referenceResult.success) {
    return {
      success: false,
      errors: referenceResult.errors,
      status: referenceResult.status,
    };
  }

  const uniquenessResult = await validateAssetSerialNumberUniqueness({
    tenantId,
    serialNumber: payloadResult.data.serialNumber,
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
