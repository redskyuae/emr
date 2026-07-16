import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientVitalSignIdSchema,
  patientVitalSignTenantIdSchema,
} from '../schemas/patient-vital-sign-schema';

export type GetPatientVitalSignsInput = {
  patientId: number;
  tenantId: string;
};

export function validateGetPatientVitalSigns(
  patientId: unknown,
  tenantId: unknown
): ValidationResult<GetPatientVitalSignsInput> {
  const patientIdResult = patientVitalSignIdSchema.safeParse(patientId);
  const tenantIdResult = patientVitalSignTenantIdSchema.safeParse(tenantId);

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
