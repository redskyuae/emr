import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentTypeIdSchema,
  type AppointmentTypeIdInput,
} from '../schemas/appointment-type-schema';

export function validateAppointmentTypeId(
  payload: unknown
): ValidationResult<AppointmentTypeIdInput> {
  const result = appointmentTypeIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`Appointment type ${String(payload)} is Invalid.`] };
  }

  return { success: true, data: result.data };
}
