import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionTypeRepository } from '../repository/admission-type-repository';
import {
  updateAdmissionTypeSchema,
  admissionTypeIdSchema,
  type UpdateAdmissionTypeInput,
} from '../schemas/admission-type-schema';
import { validateAdmissionTypeUniqueness } from './admission-type-uniqueness-validator';

export type UpdateAdmissionTypeParams = {
  id: number;
  payload: UpdateAdmissionTypeInput;
};

export async function validateUpdateAdmissionType(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAdmissionTypeParams>> {
  const idResult = admissionTypeIdSchema.safeParse(id);
  const payloadResult = updateAdmissionTypeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Admission type ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAdmissionType = await admissionTypeRepository.getAdmissionTypeById(
    idResult.data,
    tenantId
  );

  if (!existingAdmissionType) {
    return {
      success: false,
      errors: ['Admission type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAdmissionTypeUniqueness({
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
