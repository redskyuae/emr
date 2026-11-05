import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import type { AyurvedaDiagnosisCode } from '../schemas/ayurveda-diagnosis-code-schema';
import { validateGetAyurvedaDiagnosisCodeById } from '../validator/get-ayurveda-diagnosis-code-by-id-validator';

export async function getAyurvedaDiagnosisCodeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AyurvedaDiagnosisCode>> {
  const validationResult = validateGetAyurvedaDiagnosisCodeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const ayurvedaDiagnosisCode = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!ayurvedaDiagnosisCode) {
    return {
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: ayurvedaDiagnosisCode };
}
