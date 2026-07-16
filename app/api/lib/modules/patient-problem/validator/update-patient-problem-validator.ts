import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientProblemRepository } from '../repository/patient-problem-repository';
import {
  patientProblemIdSchema,
  updatePatientProblemSchema,
} from '../schemas/patient-problem-schema';
import type { ValidatedProblemPayload } from './create-patient-problem-validator';
import {
  validateDiagnosisCodeReference,
  validatePatientExistsForProblem,
} from './patient-problem-reference-validator';

export type UpdatePatientProblemParams = {
  id: number;
  payload: ValidatedProblemPayload;
};

export async function validateUpdatePatientProblem(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdatePatientProblemParams>> {
  const idResult = patientProblemIdSchema.safeParse(id);
  const payloadResult = updatePatientProblemSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Problem ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existing = await patientProblemRepository.getPatientProblemById(idResult.data, tenantId);

  if (!existing) {
    return { success: false, errors: ['Problem not found'], status: StatusCodes.NOT_FOUND };
  }

  const patientResult = await validatePatientExistsForProblem(existing.patientId, tenantId);

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

  return { success: true, data: { id: idResult.data, payload: { ...payloadResult.data, title } } };
}
