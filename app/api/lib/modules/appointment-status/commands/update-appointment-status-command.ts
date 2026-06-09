import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import type { AppointmentStatus } from '../schemas/appointment-status-schema';
import { getAppointmentStatusUniqueConstraintErrors } from '../validator/appointment-status-uniqueness-validator';
import { validateUpdateAppointmentStatus } from '../validator/update-appointment-status-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateAppointmentStatusCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<AppointmentStatus>> {
  const validationResult = await validateUpdateAppointmentStatus(id, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;

  try {
    const updatedAppointmentStatus = await appointmentStatusRepository.updateAppointmentStatus(
      validatedId,
      validationResult.data.payload
    );

    if (!updatedAppointmentStatus) {
      return {
        success: false,
        errors: ['Appointment status not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedAppointmentStatus };
  } catch (error) {
    const constraintErrors = getAppointmentStatusUniqueConstraintErrors(
      error,
      validationResult.data.payload
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
