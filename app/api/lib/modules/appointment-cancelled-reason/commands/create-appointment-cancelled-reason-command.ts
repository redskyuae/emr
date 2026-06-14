import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import type { AppointmentCancelledReason } from '../schemas/appointment-cancelled-reason-schema';
import { getAppointmentCancelledReasonUniqueConstraintErrors } from '../validator/appointment-cancelled-reason-uniqueness-validator';
import { validateCreateAppointmentCancelledReason } from '../validator/create-appointment-cancelled-reason-validator';

export async function createAppointmentCancelledReasonCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AppointmentCancelledReason>> {
  const validationResult = await validateCreateAppointmentCancelledReason(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const appointmentCancelledReasonData = { ...validationResult.data, tenantId };

  try {
    const createdAppointmentCancelledReason =
      await appointmentCancelledReasonRepository.createAppointmentCancelledReason(
        appointmentCancelledReasonData
      );
    return { success: true, data: createdAppointmentCancelledReason };
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
