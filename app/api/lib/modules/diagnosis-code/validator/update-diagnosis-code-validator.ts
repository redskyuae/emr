import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateDiagnosisCodeInput,
  updateDiagnosisCodeSchema,
  diagnosisCodeIdSchema,
} from '../schemas/diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import { validateDiagnosisCodeUniqueness } from './diagnosis-code-uniqueness-validator';

export type UpdateDiagnosisCodeParams = {
  id: number;
  payload: UpdateDiagnosisCodeInput;
};

export async function validateUpdateDiagnosisCode(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateDiagnosisCodeParams>> {
  const idResult = diagnosisCodeIdSchema.safeParse(id);
  const payloadResult = updateDiagnosisCodeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Diagnosis code ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingDiagnosisCode = await diagnosisCodeRepository.getDiagnosisCodeById(
    idResult.data,
    tenantId
  );

  if (!existingDiagnosisCode) {
    return {
      success: false,
      errors: ['Diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateDiagnosisCodeUniqueness({
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
