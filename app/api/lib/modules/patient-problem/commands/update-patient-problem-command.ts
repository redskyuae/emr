import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientProblemRepository } from '../repository/patient-problem-repository';
import type { PatientProblem } from '../schemas/patient-problem-schema';
import { validateUpdatePatientProblem } from '../validator/update-patient-problem-validator';

export async function updatePatientProblemCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<PatientProblem>> {
  const validationResult = await validateUpdatePatientProblem(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const updated = await patientProblemRepository.updatePatientProblem(validationResult.data.id, {
    ...validationResult.data.payload,
    tenantId,
  });

  if (!updated) {
    return { success: false, errors: ['Problem not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updated };
}
