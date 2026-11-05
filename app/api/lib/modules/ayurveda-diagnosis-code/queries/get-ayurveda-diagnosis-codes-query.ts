import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import type { AyurvedaDiagnosisCode } from '../schemas/ayurveda-diagnosis-code-schema';
import { validateGetAyurvedaDiagnosisCodes } from '../validator/get-ayurveda-diagnosis-codes-validator';

type GetAyurvedaDiagnosisCodesParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: unknown;
  isActive?: boolean;
};

export async function getAyurvedaDiagnosisCodesQuery({
  tenantId,
  page,
  limit,
  query,
  isActive,
}: GetAyurvedaDiagnosisCodesParams): Promise<ListQueryResult<AyurvedaDiagnosisCode>> {
  const tenantIdValidationResult = validateGetAyurvedaDiagnosisCodes(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
    isActive,
  });

  return { success: true, data, total };
}
