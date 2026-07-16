import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientAllergyIdSchema,
  patientAllergyTenantIdSchema,
} from '../schemas/patient-allergy-schema';

export type DeletePatientAllergyInput = {
  id: number;
  tenantId: string;
};

export function validateDeletePatientAllergy(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeletePatientAllergyInput> {
  const idResult = patientAllergyIdSchema.safeParse(id);
  const tenantIdResult = patientAllergyTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Allergy ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
