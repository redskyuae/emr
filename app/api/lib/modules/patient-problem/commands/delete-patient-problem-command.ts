import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientProblemRepository } from '../repository/patient-problem-repository';
import type { PatientProblem } from '../schemas/patient-problem-schema';
import { validateDeletePatientProblem } from '../validator/delete-patient-problem-validator';

export async function deletePatientProblemCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<PatientProblem>> {
  const validationResult = validateDeletePatientProblem(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleted = await patientProblemRepository.deletePatientProblem(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deleted) {
    return { success: false, errors: ['Problem not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: deleted };
}
