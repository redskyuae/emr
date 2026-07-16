import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import type { PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateDeletePatientVitalSign } from '../validator/delete-patient-vital-sign-validator';

export async function deletePatientVitalSignCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<PatientVitalSign>> {
  const validationResult = validateDeletePatientVitalSign(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleted = await patientVitalSignRepository.deletePatientVitalSign(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deleted) {
    return { success: false, errors: ['Vital sign not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: deleted };
}
