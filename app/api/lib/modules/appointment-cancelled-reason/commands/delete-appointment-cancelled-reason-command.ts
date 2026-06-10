import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import type { AppointmentCancelledReason } from '../schemas/appointment-cancelled-reason-schema';
import { validateDeleteAppointmentCancelledReason } from '../validator/delete-appointment-cancelled-reason-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteAppointmentCancelledReasonCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AppointmentCancelledReason>> {
  const validationResult = validateDeleteAppointmentCancelledReason(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAppointmentCancelledReason =
    await appointmentCancelledReasonRepository.softDeleteAppointmentCancelledReason(
      validationResult.data.id,
      validationResult.data.tenantId
    );

  if (!deletedAppointmentCancelledReason) {
    return {
      success: false,
      errors: ['Appointment cancelled reason not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedAppointmentCancelledReason };
}
