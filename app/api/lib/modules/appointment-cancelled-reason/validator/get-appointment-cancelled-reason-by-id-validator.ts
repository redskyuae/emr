import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  appointmentCancelledReasonIdSchema,
  appointmentCancelledReasonTenantIdSchema,
} from '../schemas/appointment-cancelled-reason-schema';

export type GetAppointmentCancelledReasonByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAppointmentCancelledReasonById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAppointmentCancelledReasonByIdInput> {
  const idResult = appointmentCancelledReasonIdSchema.safeParse(id);
  const tenantIdResult = appointmentCancelledReasonTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment cancelled reason ${String(id)} is Invalid.`);
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
