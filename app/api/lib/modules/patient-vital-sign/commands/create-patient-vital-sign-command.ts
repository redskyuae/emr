import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import { computeBmi, type PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateCreatePatientVitalSign } from '../validator/create-patient-vital-sign-validator';

export async function createPatientVitalSignCommand(
  patientId: unknown,
  tenantId: string,
  recordedByUserId: string,
  payload: unknown
): Promise<CommandResult<PatientVitalSign>> {
  const validationResult = await validateCreatePatientVitalSign(patientId, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const { payload: data } = validationResult.data;
  const bmi = computeBmi(data.heightCm, data.weightKg);

  const created = await patientVitalSignRepository.createPatientVitalSign({
    ...data,
    bmi,
    tenantId,
    patientId: validationResult.data.patientId,
    recordedByUserId,
  });

  return { success: true, data: created };
}
