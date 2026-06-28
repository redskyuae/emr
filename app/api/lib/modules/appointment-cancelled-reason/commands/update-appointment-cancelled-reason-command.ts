import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import type { AppointmentCancelledReason } from '../schemas/appointment-cancelled-reason-schema';
import { getAppointmentCancelledReasonUniqueConstraintErrors } from '../validator/appointment-cancelled-reason-uniqueness-validator';
import { validateUpdateAppointmentCancelledReason } from '../validator/update-appointment-cancelled-reason-validator';

export async function updateAppointmentCancelledReasonCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AppointmentCancelledReason>> {
  const validationResult = await validateUpdateAppointmentCancelledReason(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const appointmentCancelledReasonData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAppointmentCancelledReason =
      await appointmentCancelledReasonRepository.updateAppointmentCancelledReason(
        validatedId,
        appointmentCancelledReasonData
      );

    if (!updatedAppointmentCancelledReason) {
      return {
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Appointment cancelled reason not found'],
      };
    }

    return { success: true, data: updatedAppointmentCancelledReason };
  } catch (error) {
    const constraintErrors = getAppointmentCancelledReasonUniqueConstraintErrors(
      error,
      appointmentCancelledReasonData
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
