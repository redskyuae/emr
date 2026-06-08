import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateAppointmentModeId } from '../validator/appointment-mode-id-validator';
import { validateAppointmentModeTenantId } from '../validator/appointment-mode-tenant-id-validator';

const NOT_FOUND_STATUS = 404;

export async function getAppointmentModeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AppointmentMode>> {
  const idValidationResult = validateAppointmentModeId(id);
  const tenantIdValidationResult = validateAppointmentModeTenantId(tenantId);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const appointmentMode = await appointmentModeRepository.getAppointmentModeById(
    idValidationResult.data,
    tenantIdValidationResult.data
  );

  if (!appointmentMode) {
    return {
      success: false,
      errors: ['Appointment mode not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: appointmentMode };
}
