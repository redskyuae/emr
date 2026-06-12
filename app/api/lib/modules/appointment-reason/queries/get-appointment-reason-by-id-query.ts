import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import type { AppointmentReason } from '../schemas/appointment-reason-schema';
import { validateGetAppointmentReasonById } from '../validator/get-appointment-reason-by-id-validator';

export async function getAppointmentReasonByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AppointmentReason>> {
  const validationResult = validateGetAppointmentReasonById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const appointmentReason = await appointmentReasonRepository.getAppointmentReasonById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!appointmentReason) {
    return {
      success: false,
      errors: ['Appointment reason not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: appointmentReason };
}
