import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { bedRepository } from '../repository/bed-repository';
import { bedIdSchema, type UpdateBedInput, updateBedSchema } from '../schemas/bed-schema';
import { validateBedNumberUniqueness } from './bed-number-validator';
import { validateBedReferences } from './bed-reference-validator';

export type ValidatedUpdateBed = {
  id: number;
  wardName: string;
  payload: UpdateBedInput;
};

export async function validateUpdateBed(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<ValidatedUpdateBed>> {
  const idResult = bedIdSchema.safeParse(id);
  const payloadResult = updateBedSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Bed ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingBed = await bedRepository.getBedById(idResult.data, tenantId);

  if (!existingBed) {
    return { success: false, errors: ['Bed not found'], status: StatusCodes.NOT_FOUND };
  }

  // An occupied Bed belongs to its Active Admission: its status is system-managed
  // (ADR 0033) and re-homing or renumbering it mid-stay would corrupt the board.
  if (existingBed.status === 'OCCUPIED') {
    return {
      success: false,
      errors: [`Bed ${existingBed.bedNumber} is occupied and its status is managed by admissions.`],
      status: StatusCodes.CONFLICT,
    };
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
    excludeId: idResult.data,
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
    data: {
      id: idResult.data,
      payload: payloadResult.data,
      wardName: referenceResult.data.ward.name,
    },
  };
}
