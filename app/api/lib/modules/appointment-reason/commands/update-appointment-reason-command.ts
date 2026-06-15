import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import type { AppointmentReason } from '../schemas/appointment-reason-schema';
import { getAppointmentReasonUniqueConstraintErrors } from '../validator/appointment-reason-uniqueness-validator';
import { validateUpdateAppointmentReason } from '../validator/update-appointment-reason-validator';

export async function updateAppointmentReasonCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AppointmentReason>> {
  const validationResult = await validateUpdateAppointmentReason(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const appointmentReasonData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAppointmentReason = await appointmentReasonRepository.updateAppointmentReason(
      validatedId,
      appointmentReasonData
    );

    if (!updatedAppointmentReason) {
      return {
        success: false,
        errors: ['Appointment reason not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAppointmentReason };
  } catch (error) {
    const constraintErrors = getAppointmentReasonUniqueConstraintErrors(
      error,
      appointmentReasonData
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
