import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { treatmentRepository } from '../repository/treatment-repository';
import {
  treatmentIdSchema,
  updateTreatmentSchema,
  type UpdateTreatmentInput,
} from '../schemas/treatment-schema';
import { validateTreatmentUniqueness } from './treatment-uniqueness-validator';

export type UpdateTreatmentParams = {
  id: number;
  payload: UpdateTreatmentInput;
};

export async function validateUpdateTreatment(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateTreatmentParams>> {
  const idResult = treatmentIdSchema.safeParse(id);
  const payloadResult = updateTreatmentSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Treatment ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingTreatment = await treatmentRepository.getTreatmentById(idResult.data, tenantId);

  if (!existingTreatment) {
    return {
      success: false,
      errors: ['Treatment not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  // Legacy identities may share names and codes with native catalogue entries.
  if (existingTreatment.legacySourceIdentity === null) {
    const uniquenessResult = await validateTreatmentUniqueness({
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
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
