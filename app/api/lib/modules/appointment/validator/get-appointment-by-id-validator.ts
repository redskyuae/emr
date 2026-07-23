import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentIdSchema, appointmentTenantIdSchema } from '../schemas/appointment-schema';

export type GetAppointmentByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAppointmentById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAppointmentByIdInput> {
  const idResult = appointmentIdSchema.safeParse(id);
  const tenantIdResult = appointmentTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
