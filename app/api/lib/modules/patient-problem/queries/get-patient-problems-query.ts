import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { patientProblemRepository } from '../repository/patient-problem-repository';
import type { PatientProblem } from '../schemas/patient-problem-schema';
import { validateGetPatientProblems } from '../validator/get-patient-problems-validator';

export type GetPatientProblemsParams = {
  patientId: unknown;
  tenantId: unknown;
  page?: number;
  limit?: number;
};

export async function getPatientProblemsQuery({
  patientId,
  tenantId,
  page,
  limit,
}: GetPatientProblemsParams): Promise<ListQueryResult<PatientProblem>> {
  const validationResult = validateGetPatientProblems(patientId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await patientProblemRepository.getPatientProblems({
    tenantId: validationResult.data.tenantId,
    patientId: validationResult.data.patientId,
    page,
    limit,
  });

  return { success: true, data, total };
}
