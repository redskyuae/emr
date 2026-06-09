import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentTypeIdSchema,
  appointmentTypeTenantIdSchema,
} from '../schemas/appointment-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetAppointmentTypeByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAppointmentTypeById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAppointmentTypeByIdInput> {
  const idResult = appointmentTypeIdSchema.safeParse(id);
  const tenantIdResult = appointmentTypeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment type ${String(id)} is Invalid.`);
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
