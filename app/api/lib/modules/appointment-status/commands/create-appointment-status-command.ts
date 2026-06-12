import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import type { AppointmentStatus } from '../schemas/appointment-status-schema';
import { getAppointmentStatusUniqueConstraintErrors } from '../validator/appointment-status-uniqueness-validator';
import { validateCreateAppointmentStatus } from '../validator/create-appointment-status-validator';

export async function createAppointmentStatusCommand(
  payload: unknown
): Promise<CommandResult<AppointmentStatus>> {
  const validationResult = await validateCreateAppointmentStatus(payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdAppointmentStatus = await appointmentStatusRepository.createAppointmentStatus(
      validationResult.data
    );
    return { success: true, data: createdAppointmentStatus };
  } catch (error) {
    const constraintErrors = getAppointmentStatusUniqueConstraintErrors(
      error,
      validationResult.data
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
