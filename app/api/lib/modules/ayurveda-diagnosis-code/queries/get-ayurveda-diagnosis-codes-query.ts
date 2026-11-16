import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import type { AyurvedaDiagnosisCode } from '../schemas/ayurveda-diagnosis-code-schema';
import { validateGetAyurvedaDiagnosisCodes } from '../validator/get-ayurveda-diagnosis-codes-validator';

type GetAyurvedaDiagnosisCodesParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: unknown;
};

export async function getAyurvedaDiagnosisCodesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAyurvedaDiagnosisCodesParams): Promise<ListQueryResult<AyurvedaDiagnosisCode>> {
  const tenantIdResult = validateGetAyurvedaDiagnosisCodes(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: tenantIdResult.errors };
  }

  const { data, total } = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes({
    tenantId: tenantIdResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
