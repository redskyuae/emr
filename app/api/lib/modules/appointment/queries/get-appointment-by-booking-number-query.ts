import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { validateGetAppointmentByBookingNumber } from '../validator/get-appointment-by-booking-number-validator';

export async function getAppointmentByBookingNumberQuery(
  bookingNumber: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Appointment>> {
  const validationResult = validateGetAppointmentByBookingNumber(bookingNumber, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const appointment = await appointmentRepository.getAppointmentByBookingNumber(
    validationResult.data.bookingNumber,
    validationResult.data.tenantId
  );

  if (!appointment) {
    return {
      success: false,
      errors: [`Appointment ${validationResult.data.bookingNumber} is Invalid.`],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: appointment };
}
