import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientChartIdSchema, patientChartTenantIdSchema } from '../schemas/patient-chart-schema';

export type GetPatientChartInput = {
  patientId: number;
  tenantId: string;
};

export async function validateGetPatientChart(
  patientId: unknown,
  tenantId: unknown
): Promise<ValidationResult<GetPatientChartInput>> {
  const patientIdResult = patientChartIdSchema.safeParse(patientId);
  const tenantIdResult = patientChartTenantIdSchema.safeParse(tenantId);

  if (!patientIdResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) {
      errors.push(`Patient ${String(patientId)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  const patient = await patientRepository.getPatientById(patientIdResult.data, tenantIdResult.data);

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return {
    success: true,
    data: { patientId: patientIdResult.data, tenantId: tenantIdResult.data },
  };
}
