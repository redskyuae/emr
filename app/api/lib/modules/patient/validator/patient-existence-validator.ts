import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../repository/patient-repository';
import { patientIdSchema, patientTenantIdSchema } from '../schemas/patient-schema';

export async function validatePatientExists(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<number>> {
  const idResult = patientIdSchema.safeParse(id);
  const tenantIdResult = patientTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Patient ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...tenantIdResult.error.issues.map((issue) => issue.message));
    }

    return { success: false, errors };
  }

  const existingPatient = await patientRepository.getPatientById(
    idResult.data,
    tenantIdResult.data
  );

  if (!existingPatient) {
    return {
      success: false,
      errors: ['Patient not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: idResult.data };
}
