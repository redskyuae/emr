import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../schemas/patient-treatment-plan-schema';
import { validateUpdatePatientTreatmentPlanSession } from '../validator/patient-treatment-plan-session-validator';

export async function updatePatientTreatmentPlanSessionCommand(
  params: Parameters<typeof validateUpdatePatientTreatmentPlanSession>[0],
  payload: unknown
): Promise<CommandResult<PatientTreatmentPlan>> {
  const validationResult = await validateUpdatePatientTreatmentPlanSession(params, payload);

  if (!validationResult.success) {
    return validationResult;
  }

  const plan = await patientTreatmentPlanRepository.updateSessionPlan(validationResult.data);

  if (!plan) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Treatment Plan Session is no longer available.'],
    };
  }

  return { success: true, data: plan };
}
