import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import { computeBmi, type PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateUpdatePatientVitalSign } from '../validator/update-patient-vital-sign-validator';

export async function updatePatientVitalSignCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<PatientVitalSign>> {
  const validationResult = await validateUpdatePatientVitalSign(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const { payload: data } = validationResult.data;
  const bmi = computeBmi(data.heightCm, data.weightKg);

  const updated = await patientVitalSignRepository.updatePatientVitalSign(
    validationResult.data.id,
    { ...data, bmi, tenantId }
  );

  if (!updated) {
    return { success: false, errors: ['Vital sign not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updated };
}
