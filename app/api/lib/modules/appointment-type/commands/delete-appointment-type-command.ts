import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { validateDeleteAppointmentType } from '../validator/delete-appointment-type-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteAppointmentTypeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AppointmentType>> {
  const validationResult = validateDeleteAppointmentType(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedAppointmentType = await appointmentTypeRepository.softDeleteAppointmentType(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAppointmentType) {
    return {
      success: false,
      errors: ['Appointment type not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedAppointmentType };
}
