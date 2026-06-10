import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import type { AppointmentReason } from '../schemas/appointment-reason-schema';
import { validateDeleteAppointmentReason } from '../validator/delete-appointment-reason-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteAppointmentReasonCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AppointmentReason>> {
  const validationResult = validateDeleteAppointmentReason(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAppointmentReason = await appointmentReasonRepository.softDeleteAppointmentReason(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAppointmentReason) {
    return {
      success: false,
      errors: ['Appointment reason not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedAppointmentReason };
}
