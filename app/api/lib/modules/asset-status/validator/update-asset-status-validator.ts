import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAssetStatusInput,
  updateAssetStatusSchema,
  assetStatusIdSchema,
} from '../schemas/asset-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assetStatusRepository } from '../repository/asset-status-repository';
import { validateAssetStatusUniqueness } from './asset-status-uniqueness-validator';

export type UpdateAssetStatusParams = {
  id: number;
  payload: UpdateAssetStatusInput;
};

export async function validateUpdateAssetStatus(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAssetStatusParams>> {
  const idResult = assetStatusIdSchema.safeParse(id);
  const payloadResult = updateAssetStatusSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Asset status ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAssetStatus = await assetStatusRepository.getAssetStatusById(
    idResult.data,
    tenantId
  );

  if (!existingAssetStatus) {
    return {
      success: false,
      errors: ['Asset status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAssetStatusUniqueness({
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
