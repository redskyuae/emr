import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { type CreateBedInput, createBedSchema } from '../schemas/bed-schema';
import { validateBedNumberUniqueness } from './bed-number-validator';
import { validateBedReferences } from './bed-reference-validator';

export type ValidatedCreateBed = {
  input: CreateBedInput;
  wardName: string;
};

export async function validateCreateBed(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<ValidatedCreateBed>> {
  const payloadResult = createBedSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const referenceResult = await validateBedReferences(payloadResult.data, tenantId);

  if (!referenceResult.success) {
    return {
      success: false,
      errors: referenceResult.errors,
      status: referenceResult.status,
    };
  }

  const uniquenessResult = await validateBedNumberUniqueness({
    tenantId,
    wardId: payloadResult.data.wardId,
    wardName: referenceResult.data.ward.name,
    bedNumber: payloadResult.data.bedNumber,
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
    data: { input: payloadResult.data, wardName: referenceResult.data.ward.name },
  };
}
