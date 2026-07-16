import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment, PotentialPatientMatch } from '../schemas/appointment-schema';
import { validateCreateAppointment } from '../validator/create-appointment-validator';

export type CreateAppointmentCommandResult = CommandResult<Appointment> & {
  patientMatches?: PotentialPatientMatch[];
};

export async function createAppointmentCommand(
  payload: unknown,
  tenantId: string
): Promise<CreateAppointmentCommandResult> {
  const validationResult = await validateCreateAppointment(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
      patientMatches: validationResult.patientMatches,
    };
  }

  try {
    const result = await appointmentRepository.createAppointment(validationResult.data);

    if (result.success) {
      return result;
    }

    if (result.outcome === 'potential-patient-match') {
      return {
        success: false,
        errors: ['Potential Patient match found. Retry with patientId.'],
        status: StatusCodes.CONFLICT,
        patientMatches: result.patientMatches,
      };
    }

    if (result.outcome === 'patient-inactive') {
      return {
        success: false,
        errors: ['Inactive Patient cannot be booked for an Appointment.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (result.outcome === 'slot-unavailable') {
      return {
        success: false,
        errors: ['One or more selected Doctor slots are no longer available.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (result.outcome === 'slot-past') {
      return { success: false, errors: ['Selected Doctor slots must be in the future.'] };
    }

    if (result.outcome === 'slot-invalid') {
      return {
        success: false,
        errors: ['Selected Doctor slots must exist and be consecutive.'],
      };
    }

    if (result.outcome === 'invalid-reference') {
      return {
        success: false,
        errors: result.invalidReferences.map((reference) => `${reference} is Invalid.`),
        status: StatusCodes.CONFLICT,
      };
    }

    return { success: false, errors: ['Appointment could not be created.'] };
  } catch (error) {
    const dbError = getDatabaseError(error);

    if (
      dbError?.code === '23505' &&
      dbError.constraint === 'appointment_slot_reservation_active_doctor_slot_idx'
    ) {
      return {
        success: false,
        errors: ['One or more selected Doctor slots are no longer available.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (
      dbError?.code === '23505' &&
      dbError.constraint === 'appointment_tenant_booking_number_idx'
    ) {
      return {
        success: false,
        errors: ['Appointment Booking Number allocation conflicted. Please retry.'],
        status: StatusCodes.CONFLICT,
      };
    }

    throw error;
  }
}
