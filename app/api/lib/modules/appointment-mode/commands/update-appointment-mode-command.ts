import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { getAppointmentModeUniqueConstraintErrors } from '../validator/appointment-mode-uniqueness-validator';
import { validateUpdateAppointmentMode } from '../validator/update-appointment-mode-validator';

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
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAppointmentMode };
  } catch (error) {
    const constraintErrors = getAppointmentModeUniqueConstraintErrors(
      error,
      validationResult.data.payload
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
