import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentStatusIdSchema,
  appointmentStatusTenantIdSchema,
} from '../schemas/appointment-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetAppointmentStatusByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAppointmentStatusById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAppointmentStatusByIdInput> {
  const idResult = appointmentStatusIdSchema.safeParse(id);
  const tenantIdResult = appointmentStatusTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment status ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
