import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  appointmentTenantIdSchema,
  procedureResourceAvailabilitySchema,
  type ProcedureResourceAvailabilityParams,
} from '../schemas/appointment-schema';

export function validateGetProcedureResourceAvailability(
  input: unknown,
  tenantId: unknown
): ValidationResult<ProcedureResourceAvailabilityParams> {
  const tenantResult = appointmentTenantIdSchema.safeParse(tenantId);
  const inputResult = procedureResourceAvailabilitySchema.safeParse(input);

  if (!tenantResult.success || !inputResult.success) {
    return {
      success: false,
      errors: [
        ...(tenantResult.success ? [] : formatValidationErrors(tenantResult.error)),
        ...(inputResult.success ? [] : formatValidationErrors(inputResult.error)),
      ],
    };
  }

  return { success: true, data: { ...inputResult.data, tenantId: tenantResult.data } };
}
