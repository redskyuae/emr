import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentModeIdSchema,
  appointmentModeTenantIdSchema,
} from '../schemas/appointment-mode-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetAppointmentModeByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAppointmentModeById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAppointmentModeByIdInput> {
  const idResult = appointmentModeIdSchema.safeParse(id);
  const tenantIdResult = appointmentModeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment mode ${String(id)} is Invalid.`);
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
