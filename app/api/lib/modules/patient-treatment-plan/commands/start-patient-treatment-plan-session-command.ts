import { StatusCodes } from 'http-status-codes';

import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../schemas/patient-treatment-plan-schema';
import { validateStartPatientTreatmentPlanSession } from '../validator/patient-treatment-plan-session-validator';

const unavailable: CommandResult<PatientTreatmentPlan> = {
  success: false,
  status: StatusCodes.CONFLICT,
  errors: ['Patient Treatment Plan Session is no longer available.'],
};

export async function startPatientTreatmentPlanSessionCommand(
  params: Parameters<typeof validateStartPatientTreatmentPlanSession>[0],
  payload: unknown
): Promise<CommandResult<PatientTreatmentPlan>> {
  const validationResult = await validateStartPatientTreatmentPlanSession(params, payload);

  if (!validationResult.success) {
    return validationResult;
  }

  try {
    const plan = await patientTreatmentPlanRepository.startSession(validationResult.data);

    return plan ? { success: true, data: plan } : unavailable;
  } catch (error) {
    const dbError = getDatabaseError(error);

    // A concurrent start already gave this Visit a Session of the same Plan.
    if (
      dbError?.code === '23505' &&
      dbError.constraint === 'patient_treatment_plan_session_tenant_plan_started_visit_idx'
    ) {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['This Visit already has a Session of this Patient Treatment Plan.'],
      };
    }

    throw error;
  }
}
