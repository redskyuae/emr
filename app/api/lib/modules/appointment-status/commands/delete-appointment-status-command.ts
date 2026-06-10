import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import type { AppointmentStatus } from '../schemas/appointment-status-schema';
import { validateDeleteAppointmentStatus } from '../validator/delete-appointment-status-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteAppointmentStatusCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AppointmentStatus>> {
  const validationResult = validateDeleteAppointmentStatus(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAppointmentStatus = await appointmentStatusRepository.softDeleteAppointmentStatus(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAppointmentStatus) {
    return {
      success: false,
      errors: ['Appointment status not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedAppointmentStatus };
}
