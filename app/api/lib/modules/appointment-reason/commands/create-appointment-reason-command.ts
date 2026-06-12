import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import type { AppointmentReason } from '../schemas/appointment-reason-schema';
import { getAppointmentReasonUniqueConstraintErrors } from '../validator/appointment-reason-uniqueness-validator';
import { validateCreateAppointmentReason } from '../validator/create-appointment-reason-validator';

export async function createAppointmentReasonCommand(
  payload: unknown
): Promise<CommandResult<AppointmentReason>> {
  const validationResult = await validateCreateAppointmentReason(payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdAppointmentReason = await appointmentReasonRepository.createAppointmentReason(
      validationResult.data
    );
    return { success: true, data: createdAppointmentReason };
  } catch (error) {
    const constraintErrors = getAppointmentReasonUniqueConstraintErrors(
      error,
      validationResult.data
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
