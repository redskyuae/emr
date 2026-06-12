import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import type { AppointmentCancelledReason } from '../schemas/appointment-cancelled-reason-schema';
import { getAppointmentCancelledReasonUniqueConstraintErrors } from '../validator/appointment-cancelled-reason-uniqueness-validator';
import { validateCreateAppointmentCancelledReason } from '../validator/create-appointment-cancelled-reason-validator';

export async function createAppointmentCancelledReasonCommand(
  payload: unknown
): Promise<CommandResult<AppointmentCancelledReason>> {
  const validationResult = await validateCreateAppointmentCancelledReason(payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdAppointmentCancelledReason =
      await appointmentCancelledReasonRepository.createAppointmentCancelledReason(
        validationResult.data
      );
    return { success: true, data: createdAppointmentCancelledReason };
  } catch (error) {
    const constraintErrors = getAppointmentCancelledReasonUniqueConstraintErrors(
      error,
      validationResult.data
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
