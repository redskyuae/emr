import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createPatientProblemSchema,
  patientProblemIdSchema,
  type ProblemClinicalStatus,
} from '../schemas/patient-problem-schema';
import {
  validateDiagnosisCodeReference,
  validatePatientExistsForProblem,
} from './patient-problem-reference-validator';

export type ValidatedProblemPayload = {
  diagnosisCodeId?: number;
  title: string;
  clinicalStatus: ProblemClinicalStatus;
  onsetDate?: string;
  resolvedDate?: string;
  notes?: string;
};

export async function validateCreatePatientProblem(
  patientId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<{ patientId: number; payload: ValidatedProblemPayload }>> {
  const patientIdResult = patientProblemIdSchema.safeParse(patientId);
  const payloadResult = createPatientProblemSchema.safeParse(payload);

  if (!patientIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) {
      errors.push(`Patient ${String(patientId)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const patientResult = await validatePatientExistsForProblem(patientIdResult.data, tenantId);

  if (!patientResult.success) {
    return patientResult;
  }

  const diagnosisResult = await validateDiagnosisCodeReference(
    payloadResult.data.diagnosisCodeId,
    tenantId
  );

  if (!diagnosisResult.success) {
    return diagnosisResult;
  }

  const title = payloadResult.data.title ?? diagnosisResult.data?.title ?? '';

  return {
    success: true,
    data: {
      patientId: patientIdResult.data,
      payload: { ...payloadResult.data, title },
    },
  };
}
