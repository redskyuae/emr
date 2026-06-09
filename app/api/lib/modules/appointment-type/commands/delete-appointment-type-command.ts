import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { validateAppointmentTypeId } from '../validator/appointment-type-id-validator';
import { validateAppointmentTypeTenantId } from '../validator/appointment-type-tenant-id-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteAppointmentTypeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AppointmentType>> {
  const idValidationResult = validateAppointmentTypeId(id);
  const tenantIdValidationResult = validateAppointmentTypeTenantId(tenantId);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const deletedAppointmentType = await appointmentTypeRepository.softDeleteAppointmentType(
    idValidationResult.data,
    tenantIdValidationResult.data
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
