import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import type { DiagnosisCode } from '../../diagnosis-code/schemas/diagnosis-code-schema';
import { patientRepository } from '../../patient/repository/patient-repository';

export async function validatePatientExistsForProblem(
  patientId: number,
  tenantId: string
): Promise<ValidationResult<void>> {
  const patient = await patientRepository.getPatientById(patientId, tenantId);

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: undefined };
}

export async function validateDiagnosisCodeReference(
  diagnosisCodeId: number | undefined,
  tenantId: string
): Promise<ValidationResult<DiagnosisCode | undefined>> {
  if (diagnosisCodeId === undefined) {
    return { success: true, data: undefined };
  }

  const diagnosisCode = await diagnosisCodeRepository.getDiagnosisCodeById(diagnosisCodeId, tenantId);

  if (!diagnosisCode) {
    return {
      success: false,
      errors: [`Diagnosis code ${diagnosisCodeId} does not exist.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  return { success: true, data: diagnosisCode };
}
