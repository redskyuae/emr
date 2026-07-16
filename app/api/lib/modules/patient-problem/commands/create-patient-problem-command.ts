import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientProblemRepository } from '../repository/patient-problem-repository';
import type { PatientProblem } from '../schemas/patient-problem-schema';
import { validateCreatePatientProblem } from '../validator/create-patient-problem-validator';

export async function createPatientProblemCommand(
  patientId: unknown,
  tenantId: string,
  recordedByUserId: string,
  payload: unknown
): Promise<CommandResult<PatientProblem>> {
  const validationResult = await validateCreatePatientProblem(patientId, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const created = await patientProblemRepository.createPatientProblem({
    ...validationResult.data.payload,
    tenantId,
    patientId: validationResult.data.patientId,
    recordedByUserId,
  });

  return { success: true, data: created };
}
