import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { validateCancelAppointment } from '../validator/cancel-appointment-validator';

export async function cancelAppointmentCommand(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Appointment>> {
  const validationResult = await validateCancelAppointment(id, payload, tenantId);

  if (!validationResult.success) return validationResult;

  const result = await appointmentRepository.cancelAppointment(validationResult.data);

  if (result.success) return result;

  if (result.outcome === 'not-found') {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: [`Appointment ${validationResult.data.id} was not found.`],
    };
  }

  if (result.outcome === 'ineligible') {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    };
  }

  if (result.outcome === 'invalid-reason') {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Appointment Cancelled Reason is not available.'],
    };
  }

  return {
    success: false,
    status: StatusCodes.CONFLICT,
    errors: ['Cancelled appointment status is not configured.'],
  };
}
