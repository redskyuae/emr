import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import type { AppointmentCancelledReason } from '../schemas/appointment-cancelled-reason-schema';
import { validateGetAppointmentCancelledReasonById } from '../validator/get-appointment-cancelled-reason-by-id-validator';

export async function getAppointmentCancelledReasonByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AppointmentCancelledReason>> {
  const validationResult = validateGetAppointmentCancelledReasonById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const appointmentCancelledReason =
    await appointmentCancelledReasonRepository.getAppointmentCancelledReasonById(
      validationResult.data.id,
      validationResult.data.tenantId
    );

  if (!appointmentCancelledReason) {
    return {
      success: false,
      errors: ['Appointment cancelled reason not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: appointmentCancelledReason };
}
