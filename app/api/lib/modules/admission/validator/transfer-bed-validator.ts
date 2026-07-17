import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { bedRepository } from '../../bed/repository/bed-repository';
import {
  admissionIdSchema,
  transferBedSchema,
  type TransferBedInput,
} from '../schemas/admission-schema';

const ADMITTABLE_BED_STATUSES = ['AVAILABLE', 'RESERVED'];

export type ValidatedTransferBed = {
  id: number;
  payload: TransferBedInput;
};

export async function validateTransferBed(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<ValidatedTransferBed>> {
  const idResult = admissionIdSchema.safeParse(id);
  const payloadResult = transferBedSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Admission ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const targetBed = await bedRepository.getBedById(payloadResult.data.toBedId, tenantId);

  if (!targetBed) {
    return {
      success: false,
      errors: [`Bed ${payloadResult.data.toBedId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  // The transaction re-checks with a guarded UPDATE; this check exists to give
  // the caller the clean message before any locks are taken (ADR 0033).
  if (!ADMITTABLE_BED_STATUSES.includes(targetBed.status)) {
    return {
      success: false,
      errors: [`Bed ${targetBed.bedNumber} is not available for admission.`],
      status: StatusCodes.CONFLICT,
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
