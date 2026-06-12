import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import type { AppointmentStatus } from '../schemas/appointment-status-schema';
import { validateGetAppointmentStatusById } from '../validator/get-appointment-status-by-id-validator';

export async function getAppointmentStatusByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AppointmentStatus>> {
  const validationResult = validateGetAppointmentStatusById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const appointmentStatus = await appointmentStatusRepository.getAppointmentStatusById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!appointmentStatus) {
    return {
      success: false,
      errors: ['Appointment status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: appointmentStatus };
}
