import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAyurvedaDiagnosisCodeInput,
  updateAyurvedaDiagnosisCodeSchema,
  ayurvedaDiagnosisCodeIdSchema,
} from '../schemas/ayurveda-diagnosis-code-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { validateAyurvedaDiagnosisCodeUniqueness } from './ayurveda-diagnosis-code-uniqueness-validator';

type UpdateAyurvedaDiagnosisCodeParams = {
  id: number;
  payload: UpdateAyurvedaDiagnosisCodeInput;
};

export async function validateUpdateAyurvedaDiagnosisCode(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAyurvedaDiagnosisCodeParams>> {
  const idResult = ayurvedaDiagnosisCodeIdSchema.safeParse(id);
  const payloadResult = updateAyurvedaDiagnosisCodeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Ayurveda diagnosis code ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAyurvedaDiagnosisCode =
    await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(idResult.data, tenantId);

  if (!existingAyurvedaDiagnosisCode) {
    return {
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAyurvedaDiagnosisCodeUniqueness({
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
