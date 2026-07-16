import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { patientProblemRepository } from '../repository/patient-problem-repository';
import type { PatientProblem } from '../schemas/patient-problem-schema';
import { validateGetPatientProblemById } from '../validator/get-patient-problem-by-id-validator';

export async function getPatientProblemByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<PatientProblem>> {
  const validationResult = validateGetPatientProblemById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const problem = await patientProblemRepository.getPatientProblemById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!problem) {
    return { success: false, errors: ['Problem not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: problem };
}
