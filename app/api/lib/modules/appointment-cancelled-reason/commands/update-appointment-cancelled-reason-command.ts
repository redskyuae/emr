import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import type { AppointmentCancelledReason } from '../schemas/appointment-cancelled-reason-schema';
import { getAppointmentCancelledReasonUniqueConstraintErrors } from '../validator/appointment-cancelled-reason-uniqueness-validator';
import { validateUpdateAppointmentCancelledReason } from '../validator/update-appointment-cancelled-reason-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateAppointmentCancelledReasonCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<AppointmentCancelledReason>> {
  const validationResult = await validateUpdateAppointmentCancelledReason(id, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;

  try {
    const updatedAppointmentCancelledReason =
      await appointmentCancelledReasonRepository.updateAppointmentCancelledReason(
        validatedId,
        validationResult.data.payload
      );

    if (!updatedAppointmentCancelledReason) {
      return {
        success: false,
        errors: ['Appointment cancelled reason not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedAppointmentCancelledReason };
  } catch (error) {
    const constraintErrors = getAppointmentCancelledReasonUniqueConstraintErrors(
      error,
      validationResult.data.payload
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
