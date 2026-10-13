import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../schemas/patient-treatment-plan-schema';
import { validateAddPatientTreatmentPlanSessions } from '../validator/patient-treatment-plan-validator';

export async function addPatientTreatmentPlanSessionsCommand(
  patientId: unknown,
  tenantId: unknown,
  payload: unknown
): Promise<CommandResult<PatientTreatmentPlan>> {
  const validationResult = await validateAddPatientTreatmentPlanSessions(
    patientId,
    tenantId,
    payload
  );

  if (!validationResult.success) {
    return validationResult;
  }

  const plan = await patientTreatmentPlanRepository.addSessionsToPlan(validationResult.data);

  if (!plan) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Treatment Plan is no longer available.'],
    };
  }

  return { success: true, data: plan };
}
