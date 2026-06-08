import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentModeIdSchema,
  type AppointmentModeIdInput,
} from '../schemas/appointment-mode-schema';

export function validateAppointmentModeId(
  payload: unknown
): ValidationResult<AppointmentModeIdInput> {
  const result = appointmentModeIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`Appointment mode ${String(payload)} is Invalid.`] };
  }

  return { success: true, data: result.data };
}
