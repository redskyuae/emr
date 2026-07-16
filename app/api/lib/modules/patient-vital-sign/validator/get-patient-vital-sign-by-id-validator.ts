import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientVitalSignIdSchema,
  patientVitalSignTenantIdSchema,
} from '../schemas/patient-vital-sign-schema';

export type GetPatientVitalSignByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetPatientVitalSignById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetPatientVitalSignByIdInput> {
  const idResult = patientVitalSignIdSchema.safeParse(id);
  const tenantIdResult = patientVitalSignTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Vital sign ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
