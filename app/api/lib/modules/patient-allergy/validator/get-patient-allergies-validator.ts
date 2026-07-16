import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientAllergyIdSchema,
  patientAllergyTenantIdSchema,
} from '../schemas/patient-allergy-schema';

export type GetPatientAllergiesInput = {
  patientId: number;
  tenantId: string;
};

export function validateGetPatientAllergies(
  patientId: unknown,
  tenantId: unknown
): ValidationResult<GetPatientAllergiesInput> {
  const patientIdResult = patientAllergyIdSchema.safeParse(patientId);
  const tenantIdResult = patientAllergyTenantIdSchema.safeParse(tenantId);

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

  return {
    success: true,
    data: { patientId: patientIdResult.data, tenantId: tenantIdResult.data },
  };
}
