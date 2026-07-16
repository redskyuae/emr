import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientMedicationIdSchema,
  patientMedicationTenantIdSchema,
} from '../schemas/patient-medication-schema';

export type GetPatientMedicationsInput = {
  patientId: number;
  tenantId: string;
};

export function validateGetPatientMedications(
  patientId: unknown,
  tenantId: unknown
): ValidationResult<GetPatientMedicationsInput> {
  const patientIdResult = patientMedicationIdSchema.safeParse(patientId);
  const tenantIdResult = patientMedicationTenantIdSchema.safeParse(tenantId);

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
