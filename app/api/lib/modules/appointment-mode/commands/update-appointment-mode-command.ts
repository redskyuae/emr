import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateAppointmentModeUniqueConstraint } from '../validator/appointment-mode-uniqueness-validator';
import { validateUpdateAppointmentMode } from '../validator/update-appointment-mode-validator';

const NOT_FOUND_STATUS = 404;

export async function updateAppointmentModeCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<AppointmentMode>> {
  const validationResult = await validateUpdateAppointmentMode(id, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;

  try {
    const updatedAppointmentMode = await appointmentModeRepository.updateAppointmentMode(
      validatedId,
      validationResult.data.payload
    );

    if (!updatedAppointmentMode) {
      return {
        success: false,
        errors: ['Appointment mode not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedAppointmentMode };
  } catch (error) {
    const constraintValidationResult = validateAppointmentModeUniqueConstraint(error);

    if (constraintValidationResult) {
      return constraintValidationResult;
    }

    throw error;
  }
}
