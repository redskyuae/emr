import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import {
  ayurvedaDiagnosisCodeIdSchema,
  updateAyurvedaDiagnosisCodeSchema,
  type UpdateAyurvedaDiagnosisCodeInput,
} from '../schemas/ayurveda-diagnosis-code-schema';
import { validateAyurvedaDiagnosisCodeReferences } from './ayurveda-diagnosis-code-reference-validator';

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

  const existing = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(
    idResult.data,
    tenantId
  );

  if (!existing) {
    return {
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const referenceResult = await validateAyurvedaDiagnosisCodeReferences({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!referenceResult.success) {
    return referenceResult;
  }

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
