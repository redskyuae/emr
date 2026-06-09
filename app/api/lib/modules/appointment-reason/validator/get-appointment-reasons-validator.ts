import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentReasonTenantIdSchema } from '../schemas/appointment-reason-schema';

export function validateGetAppointmentReasons(tenantId: unknown): ValidationResult<string> {
  const result = appointmentReasonTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
