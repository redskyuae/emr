import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { visitDiagnosisRepository } from '../repository/visit-diagnosis-repository';
import type { VisitDiagnosis } from '../schemas/visit-diagnosis-schema';
import { validateListVisitDiagnoses } from '../validator/list-visit-diagnoses-validator';

export async function listVisitDiagnosesQuery(
  visitId: unknown,
  tenantId: unknown
): Promise<ListQueryResult<VisitDiagnosis>> {
  const validationResult = await validateListVisitDiagnoses(visitId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const diagnoses = await visitDiagnosisRepository.listByVisit(
    validationResult.data.tenantId,
    validationResult.data.visitId
  );

  return { success: true, data: diagnoses, total: diagnoses.length };
}
