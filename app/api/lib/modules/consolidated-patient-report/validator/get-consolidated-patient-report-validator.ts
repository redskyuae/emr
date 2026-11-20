import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientIdSchema, patientTenantIdSchema } from '../../patient/schemas/patient-schema';
import {
  consolidatedReportPeriodSchema,
  type ConsolidatedReportParams,
} from '../schemas/consolidated-patient-report-schema';

export type GetConsolidatedPatientReportInput = {
  toDate?: unknown;
  fromDate?: unknown;
};

export async function validateGetConsolidatedPatientReport(
  patientId: unknown,
  tenantId: unknown,
  input: GetConsolidatedPatientReportInput
): Promise<ValidationResult<ConsolidatedReportParams>> {
  const patientIdResult = patientIdSchema.safeParse(patientId);
  const tenantIdResult = patientTenantIdSchema.safeParse(tenantId);
  const periodResult = consolidatedReportPeriodSchema.safeParse({
    toDate: input.toDate,
    fromDate: input.fromDate,
  });

  if (!patientIdResult.success || !tenantIdResult.success || !periodResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) {
      errors.push(`Patient ${String(patientId)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!periodResult.success) {
      errors.push(...formatValidationErrors(periodResult.error));
    }

    return { success: false, errors };
  }

  const patient = await patientRepository.getPatientById(patientIdResult.data, tenantIdResult.data);

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return {
    success: true,
    data: {
      toDate: periodResult.data.toDate,
      fromDate: periodResult.data.fromDate,
      tenantId: tenantIdResult.data,
      patientId: patientIdResult.data,
    },
  };
}
