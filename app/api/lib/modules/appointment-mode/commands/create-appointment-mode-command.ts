import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateAppointmentModeUniqueConstraint } from '../validator/appointment-mode-uniqueness-validator';
import { validateCreateAppointmentMode } from '../validator/create-appointment-mode-validator';

export async function createAppointmentModeCommand(
  payload: unknown
): Promise<CommandResult<AppointmentMode>> {
  const validationResult = await validateCreateAppointmentMode(payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdAppointmentMode = await appointmentModeRepository.createAppointmentMode(
      validationResult.data
    );
    return { success: true, data: createdAppointmentMode };
  } catch (error) {
    const constraintValidationResult = validateAppointmentModeUniqueConstraint(error);

    if (constraintValidationResult) {
      return constraintValidationResult;
    }

    throw error;
  }
}
