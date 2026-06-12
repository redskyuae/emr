import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateDeleteAppointmentMode } from '../validator/delete-appointment-mode-validator';

export async function deleteAppointmentModeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AppointmentMode>> {
  const validationResult = validateDeleteAppointmentMode(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAppointmentMode = await appointmentModeRepository.softDeleteAppointmentMode(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAppointmentMode) {
    return {
      success: false,
      errors: ['Appointment mode not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAppointmentMode };
}
