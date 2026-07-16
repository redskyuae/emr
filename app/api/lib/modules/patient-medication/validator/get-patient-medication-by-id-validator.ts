import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientMedicationIdSchema,
  patientMedicationTenantIdSchema,
} from '../schemas/patient-medication-schema';

export type GetPatientMedicationByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetPatientMedicationById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetPatientMedicationByIdInput> {
  const idResult = patientMedicationIdSchema.safeParse(id);
  const tenantIdResult = patientMedicationTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Medication ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
