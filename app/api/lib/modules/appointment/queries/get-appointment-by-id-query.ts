import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { validateGetAppointmentById } from '../validator/get-appointment-by-id-validator';

export async function getAppointmentByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Appointment>> {
  const validationResult = validateGetAppointmentById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const appointment = await appointmentRepository.getAppointmentById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!appointment) {
    return { success: false, errors: ['Appointment not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: appointment };
}
