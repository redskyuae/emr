import { StatusCodes } from 'http-status-codes';

import type { CommandResultWith } from '@/app/api/lib/utils/types';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { validateCancelAppointment } from '../validator/cancel-appointment-validator';

/** Internal only (analytics); the cancellation response returns `data` alone. */
type CancelAppointmentInternals = { timeZone: string | null };

export async function cancelAppointmentCommand(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<CommandResultWith<Appointment, CancelAppointmentInternals>> {
  const validationResult = await validateCancelAppointment(id, payload, tenantId);

  if (!validationResult.success) return validationResult;

  const { timeZone, ...cancellation } = validationResult.data;
  const result = await appointmentRepository.cancelAppointment(cancellation);

  if (result.success) return { ...result, timeZone };

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
