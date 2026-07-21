import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  appointmentTenantIdSchema,
  listAppointmentsSchema,
  type AppointmentListParams,
} from '../schemas/appointment-schema';

export function validateGetAppointments(
  filters: unknown,
  tenantId: unknown
): ValidationResult<AppointmentListParams> {
  const tenantIdResult = appointmentTenantIdSchema.safeParse(tenantId);
  const filtersResult = listAppointmentsSchema.safeParse(filters ?? {});

  if (!tenantIdResult.success || !filtersResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!filtersResult.success) {
      errors.push(...formatValidationErrors(filtersResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { ...filtersResult.data, tenantId: tenantIdResult.data },
  };
}
