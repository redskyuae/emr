import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import {
  addPatientTreatmentPlanSessionsSchema,
  patientTreatmentPlanPatientIdSchema,
  patientTreatmentPlanTenantIdSchema,
  type AddPatientTreatmentPlanSessionsInput,
} from '../schemas/patient-treatment-plan-schema';

const currentStatusSchema = z.literal('current', {
  error: 'Patient Treatment Plan status must be current',
});

export type GetPatientTreatmentPlansParams = {
  patientId: number;
  tenantId: string;
  status: 'current';
};

export async function validateGetPatientTreatmentPlans(
  patientId: unknown,
  tenantId: unknown,
  status: unknown
): Promise<ValidationResult<GetPatientTreatmentPlansParams>> {
  const patientIdResult = patientTreatmentPlanPatientIdSchema.safeParse(patientId);
  const tenantIdResult = patientTreatmentPlanTenantIdSchema.safeParse(tenantId);
  const statusResult = currentStatusSchema.safeParse(status);

  if (!patientIdResult.success || !tenantIdResult.success || !statusResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) errors.push(`Patient ${String(patientId)} is Invalid.`);
    if (!tenantIdResult.success) {
      errors.push(...tenantIdResult.error.issues.map((issue) => issue.message));
    }
    if (!statusResult.success) {
      errors.push(...statusResult.error.issues.map((issue) => issue.message));
    }

    return { success: false, errors };
  }

  const patient = await patientRepository.getPatientById(patientIdResult.data, tenantIdResult.data);

  if (!patient) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient not found'],
    };
  }

  return {
    success: true,
    data: {
      patientId: patientIdResult.data,
      tenantId: tenantIdResult.data,
      status: statusResult.data,
    },
  };
}

export async function validateAddPatientTreatmentPlanSessions(
  patientId: unknown,
  tenantId: unknown,
  payload: unknown
): Promise<ValidationResult<AddPatientTreatmentPlanSessionsInput>> {
  const patientIdResult = patientTreatmentPlanPatientIdSchema.safeParse(patientId);
  const tenantIdResult = patientTreatmentPlanTenantIdSchema.safeParse(tenantId);
  const payloadResult = addPatientTreatmentPlanSessionsSchema.safeParse(payload);

  if (!patientIdResult.success || !tenantIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) errors.push(`Patient ${String(patientId)} is Invalid.`);
    if (!tenantIdResult.success) {
      errors.push(...tenantIdResult.error.issues.map((issue) => issue.message));
    }
    if (!payloadResult.success) {
      errors.push(...payloadResult.error.issues.map((issue) => issue.message));
    }

    return { success: false, errors };
  }

  const patient = await patientRepository.getPatientById(patientIdResult.data, tenantIdResult.data);

  if (!patient) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient not found'],
    };
  }

  const plans = await patientTreatmentPlanRepository.getCurrentByPatientId(
    patientIdResult.data,
    tenantIdResult.data
  );
  const plan = plans.find(
    (candidate) => candidate.id === payloadResult.data.patientTreatmentPlanId
  );

  if (!plan) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient Treatment Plan not found'],
    };
  }

  return {
    success: true,
    data: {
      patientId: patientIdResult.data,
      tenantId: tenantIdResult.data,
      ...payloadResult.data,
    },
  };
}
