import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { getAppointmentModeUniqueConstraintErrors } from '../validator/appointment-mode-uniqueness-validator';
import { validateCreateAppointmentMode } from '../validator/create-appointment-mode-validator';

export async function createAppointmentModeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AppointmentMode>> {
  const validationResult = await validateCreateAppointmentMode(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const appointmentModeData = { ...validationResult.data, tenantId };

  try {
    const createdAppointmentMode =
      await appointmentModeRepository.createAppointmentMode(appointmentModeData);
    return { success: true, data: createdAppointmentMode };
  } catch (error) {
    const constraintErrors = getAppointmentModeUniqueConstraintErrors(error, appointmentModeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
