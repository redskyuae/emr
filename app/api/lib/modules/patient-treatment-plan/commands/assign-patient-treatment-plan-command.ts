import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../schemas/patient-treatment-plan-schema';
import { validateAssignPatientTreatmentPlan } from '../validator/assign-patient-treatment-plan-validator';

export async function assignPatientTreatmentPlanCommand(
  patientId: unknown,
  tenantId: unknown,
  payload: unknown
): Promise<CommandResult<PatientTreatmentPlan>> {
  const validation = await validateAssignPatientTreatmentPlan(patientId, tenantId, payload);
  if (!validation.success) return validation;

  const plan = await patientTreatmentPlanRepository.assignTreatmentToPatient(validation.data);
  if (!plan) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Treatment Plan could not be created.'],
    };
  }
  return { success: true, data: plan };
}
