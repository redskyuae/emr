import type { CommandResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { StatusCodes } from 'http-status-codes';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { validateRescheduleAppointment } from '../validator/reschedule-appointment-validator';

export async function rescheduleAppointmentCommand(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Appointment>> {
  const validationResult = await validateRescheduleAppointment(id, payload, tenantId);

  if (!validationResult.success) {
    return validationResult;
  }

  try {
    const result = await appointmentRepository.rescheduleAppointment(validationResult.data);

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
        errors: ['Only Scheduled or Confirmed Appointments can be rescheduled.'],
      };
    }
    if (result.outcome === 'booking-path-mismatch') {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Appointment Booking Path cannot be changed when rescheduling.'],
      };
    }
    if (result.outcome === 'no-change') {
      return { success: false, errors: ['The Appointment schedule has not changed.'] };
    }
    if (result.outcome === 'invalid-reference') {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Appointment scheduling reference is Invalid.'],
      };
    }
    if (result.outcome === 'slot-invalid') {
      return {
        success: false,
        errors: ['Selected Doctor slots must exist and be consecutive.'],
      };
    }
    if (result.outcome === 'slot-unavailable') {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['One or more selected Doctor slots are no longer available.'],
      };
    }

    return {
      success: false,
      errors: [
        validationResult.data.bookingPath === 'PROCEDURE'
          ? 'Procedure time must be in the future.'
          : 'Selected Doctor slots must be in the future.',
      ],
    };
  } catch (error) {
    const dbError = getDatabaseError(error);

    if (
      dbError?.code === '23505' &&
      dbError.constraint === 'appointment_slot_reservation_active_doctor_slot_idx'
    ) {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['One or more selected Doctor slots are no longer available.'],
      };
    }

    throw error;
  }
}
