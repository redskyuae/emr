import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateGetAppointmentModeById } from '../validator/get-appointment-mode-by-id-validator';

const NOT_FOUND_STATUS = 404;

export async function getAppointmentModeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AppointmentMode>> {
  const validationResult = validateGetAppointmentModeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const appointmentMode = await appointmentModeRepository.getAppointmentModeById(
    validationResult.data.id,
    validationResult.data.tenantId
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
