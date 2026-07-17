import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionRepository } from '../repository/admission-repository';
import {
  admissionIdSchema,
  updateAdmissionSchema,
  type UpdateAdmissionInput,
} from '../schemas/admission-schema';

export type UpdateAdmissionParams = {
  id: number;
  payload: UpdateAdmissionInput;
};

export async function validateUpdateAdmission(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAdmissionParams>> {
  const idResult = admissionIdSchema.safeParse(id);
  const payloadResult = updateAdmissionSchema.safeParse(payload);

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

  const existingAdmission = await admissionRepository.getAdmissionById(idResult.data, tenantId);

  if (!existingAdmission) {
    return { success: false, errors: ['Admission not found'], status: StatusCodes.NOT_FOUND };
  }

  // A closed Admission is a historical record; only an Active Admission is
  // still being written up (ADR 0035).
  if (existingAdmission.status !== 'ADMITTED') {
    return {
      success: false,
      errors: [`Admission ${existingAdmission.admissionNumber} is closed and cannot be edited.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: { id: idResult.data, payload: payloadResult.data },
  };
}
