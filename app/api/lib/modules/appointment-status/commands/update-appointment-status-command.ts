import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import type { AppointmentStatus } from '../schemas/appointment-status-schema';
import { getAppointmentStatusUniqueConstraintErrors } from '../validator/appointment-status-uniqueness-validator';
import { validateUpdateAppointmentStatus } from '../validator/update-appointment-status-validator';

export async function updateAppointmentStatusCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AppointmentStatus>> {
  const validationResult = await validateUpdateAppointmentStatus(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const appointmentStatusData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAppointmentStatus = await appointmentStatusRepository.updateAppointmentStatus(
      validatedId,
      appointmentStatusData
    );

    if (!updatedAppointmentStatus) {
      return {
        success: false,
        errors: ['Appointment status not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAppointmentStatus };
  } catch (error) {
    const constraintErrors = getAppointmentStatusUniqueConstraintErrors(
      error,
      appointmentStatusData
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
