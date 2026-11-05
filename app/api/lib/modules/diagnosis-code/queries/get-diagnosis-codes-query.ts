import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../schemas/diagnosis-code-schema';
import { validateGetDiagnosisCodes } from '../validator/get-diagnosis-codes-validator';

export type GetDiagnosisCodesParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: unknown;
  isActive?: boolean;
};

export async function getDiagnosisCodesQuery({
  tenantId,
  page,
  limit,
  query,
  isActive,
}: GetDiagnosisCodesParams): Promise<ListQueryResult<DiagnosisCode>> {
  const tenantIdValidationResult = validateGetDiagnosisCodes(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await diagnosisCodeRepository.getDiagnosisCodes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
    isActive,
  });

  return { success: true, data, total };
}
