import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentCancelledReasonTenantIdSchema } from '../schemas/appointment-cancelled-reason-schema';

export function validateGetAppointmentCancelledReasons(
  tenantId: unknown
): ValidationResult<string> {
  const result = appointmentCancelledReasonTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
