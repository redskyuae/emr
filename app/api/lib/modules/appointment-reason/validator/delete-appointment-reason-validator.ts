import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  appointmentReasonIdSchema,
  appointmentReasonTenantIdSchema,
} from '../schemas/appointment-reason-schema';

export type DeleteAppointmentReasonInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteAppointmentReason(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteAppointmentReasonInput> {
  const idResult = appointmentReasonIdSchema.safeParse(id);
  const tenantIdResult = appointmentReasonTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment reason ${String(id)} is Invalid.`);
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
