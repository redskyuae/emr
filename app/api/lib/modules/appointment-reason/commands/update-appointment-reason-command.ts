import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import type { AppointmentReason } from '../schemas/appointment-reason-schema';
import { getAppointmentReasonUniqueConstraintErrors } from '../validator/appointment-reason-uniqueness-validator';
import { validateUpdateAppointmentReason } from '../validator/update-appointment-reason-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateAppointmentReasonCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<AppointmentReason>> {
  const validationResult = await validateUpdateAppointmentReason(id, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;

  try {
    const updatedAppointmentReason = await appointmentReasonRepository.updateAppointmentReason(
      validatedId,
      validationResult.data.payload
    );

    if (!updatedAppointmentReason) {
      return {
        success: false,
        errors: ['Appointment reason not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedAppointmentReason };
  } catch (error) {
    const constraintErrors = getAppointmentReasonUniqueConstraintErrors(
      error,
      validationResult.data.payload
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
