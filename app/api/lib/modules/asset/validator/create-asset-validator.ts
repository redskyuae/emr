import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { type CreateAssetInput, createAssetSchema } from '../schemas/asset-schema';
import { validateAssetReferences } from './asset-reference-validator';
import { validateAssetSerialNumberUniqueness } from './asset-serial-number-validator';

export async function validateCreateAsset(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAssetInput>> {
  const payloadResult = createAssetSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
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
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: payloadResult.data };
}
