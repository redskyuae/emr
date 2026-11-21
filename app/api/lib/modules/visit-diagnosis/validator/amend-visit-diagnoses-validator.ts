import type { ValidationResult } from '@/app/api/lib/utils/types';
import { validateVisitForAmendment } from '../../visit/validator/visit-amendment-validator';
import type { VisitDiagnosisEntry } from '../schemas/visit-diagnosis-schema';
import {
  parseVisitDiagnosesPayload,
  validateVisitDiagnosisReferences,
} from './visit-diagnoses-payload-validator';

type AmendVisitDiagnosesParams = {
  visitId: number;
  diagnoses: VisitDiagnosisEntry[];
  /** When the amended Visit was completed; reported with the amendment, not written. */
  visitCompletedAt: Date | null;
};

// Only a Completed Visit's diagnoses are amended; Active Visits use the save path.
export async function validateAmendVisitDiagnoses(
  visitId: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<AmendVisitDiagnosesParams>> {
  const parsed = parseVisitDiagnosesPayload(visitId, payload);

  if (!parsed.success) {
    return parsed;
  }

  const visitResult = await validateVisitForAmendment(parsed.data.visitId, tenantId);

  if (!visitResult.success) {
    return visitResult;
  }

  const referenceResult = await validateVisitDiagnosisReferences(
    tenantId,
    parsed.data.visitId,
    parsed.data.diagnoses
  );

  if (!referenceResult.success) {
    return referenceResult;
  }

  return {
    success: true,
    data: { ...parsed.data, visitCompletedAt: visitResult.data.completedAt },
  };
}
