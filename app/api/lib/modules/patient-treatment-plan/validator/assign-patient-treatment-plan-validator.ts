import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../../patient/repository/patient-repository';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import {
  assignPatientTreatmentPlanRequestSchema,
  patientTreatmentPlanPatientIdSchema,
  patientTreatmentPlanTenantIdSchema,
} from '../schemas/patient-treatment-plan-schema';
import type { CatalogueAssignment } from '../repository/patient-treatment-plan-repository';

export async function validateAssignPatientTreatmentPlan(
  patientId: unknown,
  tenantId: unknown,
  payload: unknown
): Promise<ValidationResult<CatalogueAssignment>> {
  const patientIdResult = patientTreatmentPlanPatientIdSchema.safeParse(patientId);
  const tenantIdResult = patientTreatmentPlanTenantIdSchema.safeParse(tenantId);
  const payloadResult = assignPatientTreatmentPlanRequestSchema.safeParse(payload);
  if (!patientIdResult.success || !tenantIdResult.success || !payloadResult.success) {
    return {
      success: false,
      errors: [
        ...(!patientIdResult.success ? [`Patient ${String(patientId)} is Invalid.`] : []),
        ...(!tenantIdResult.success
          ? tenantIdResult.error.issues.map((issue) => issue.message)
          : []),
        ...(!payloadResult.success ? payloadResult.error.issues.map((issue) => issue.message) : []),
      ],
    };
  }

  const [patient, treatment] = await Promise.all([
    patientRepository.getPatientById(patientIdResult.data, tenantIdResult.data),
    treatmentRepository.getTreatmentById(payloadResult.data.treatmentId, tenantIdResult.data),
  ]);
  if (!patient) {
    return { success: false, status: StatusCodes.NOT_FOUND, errors: ['Patient not found'] };
  }
  if (patient.registrationStatus !== 'registered') {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient must be registered before assigning a Treatment Plan.'],
    };
  }
  if (!patient.isActive) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient is inactive and cannot be assigned a Treatment Plan.'],
    };
  }
  if (!treatment) {
    return { success: false, status: StatusCodes.NOT_FOUND, errors: ['Treatment not found'] };
  }
  if (treatment.sessions.length === 0) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Treatment has no Session templates.'],
    };
  }
  if (treatment.sessionStructure === 'REPEATABLE' && !payloadResult.data.totalSessions) {
    return {
      success: false,
      errors: ['Number of Sessions is required for a Repeatable Treatment.'],
    };
  }
  if (
    treatment.sessionStructure === 'REPEATABLE' &&
    payloadResult.data.additionalSessions !== undefined
  ) {
    return {
      success: false,
      errors: ['Additional Sessions are only available for a Sequenced Treatment.'],
    };
  }
  if (
    treatment.sessionStructure === 'SEQUENCED' &&
    payloadResult.data.totalSessions !== undefined
  ) {
    return {
      success: false,
      errors: ['Sequenced Treatment derives its count from Session templates.'],
    };
  }

  return {
    success: true,
    data: {
      tenantId: tenantIdResult.data,
      patientId: patientIdResult.data,
      treatmentId: payloadResult.data.treatmentId,
      totalSessions: payloadResult.data.totalSessions,
      additionalSessions: payloadResult.data.additionalSessions,
    },
  };
}
