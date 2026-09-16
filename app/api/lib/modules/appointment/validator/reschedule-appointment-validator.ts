import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { StatusCodes } from 'http-status-codes';
import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import {
  appointmentIdSchema,
  appointmentTenantIdSchema,
  formatAppointmentDate,
  rescheduleAppointmentSchema,
  type ValidatedRescheduleAppointmentData,
} from '../schemas/appointment-schema';
import { isFutureSlotSelection, isValidSlotSelection } from '../schemas/appointment-slot';

export async function validateRescheduleAppointment(
  id: unknown,
  payload: unknown,
  tenantId: unknown
): Promise<ValidationResult<ValidatedRescheduleAppointmentData>> {
  const idResult = appointmentIdSchema.safeParse(id);
  const tenantIdResult = appointmentTenantIdSchema.safeParse(tenantId);
  const payloadResult = rescheduleAppointmentSchema.safeParse(payload);

  if (!idResult.success || !tenantIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) errors.push(...formatValidationErrors(idResult.error));
    if (!tenantIdResult.success) errors.push(...formatValidationErrors(tenantIdResult.error));
    if (!payloadResult.success) errors.push(...formatValidationErrors(payloadResult.error));

    return { success: false, errors };
  }

  const appointment = await appointmentRepository.getAppointmentById(
    idResult.data,
    tenantIdResult.data
  );

  if (!appointment) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: [`Appointment ${idResult.data} was not found.`],
    };
  }

  if (
    appointment.appointmentStatus.category !== 'scheduled' &&
    appointment.appointmentStatus.category !== 'confirmed'
  ) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be rescheduled.'],
    };
  }

  if (appointment.bookingPath !== payloadResult.data.bookingPath) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Appointment Booking Path cannot be changed when rescheduling.'],
    };
  }

  if (
    payloadResult.data.bookingPath === 'PROCEDURE' &&
    appointment.slotDate === formatAppointmentDate(payloadResult.data.slotDate) &&
    appointment.startTime === payloadResult.data.startTime &&
    appointment.endTime === payloadResult.data.endTime
  ) {
    return { success: false, errors: ['The Appointment schedule has not changed.'] };
  }

  if (
    payloadResult.data.bookingPath === 'CONSULTATION' &&
    appointment.slotDate === formatAppointmentDate(payloadResult.data.slotDate) &&
    appointment.doctor?.id === payloadResult.data.doctorId &&
    appointment.doctorRotaId === payloadResult.data.doctorRotaId &&
    appointment.slots.map((slot) => slot.slotTime).join(',') ===
      payloadResult.data.slotTimes.join(',')
  ) {
    return { success: false, errors: ['The Appointment schedule has not changed.'] };
  }

  const [tenant, scheduledStatus] = await Promise.all([
    tenantRepository.getTenantById(tenantIdResult.data),
    appointmentStatusRepository.findSystemByCategory(tenantIdResult.data, 'SCHEDULED'),
  ]);
  const errors: string[] = [];

  if (!tenant) errors.push('Tenant not found');
  if (!scheduledStatus) errors.push('Scheduled appointment status is not configured.');

  if (errors.length > 0 || !tenant) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  if (
    payloadResult.data.bookingPath === 'PROCEDURE' &&
    !isFutureSlotSelection(
      payloadResult.data.slotDate,
      payloadResult.data.startTime,
      tenant.timeZone
    )
  ) {
    return { success: false, errors: ['Procedure time must be in the future.'] };
  }

  if (payloadResult.data.bookingPath === 'CONSULTATION') {
    const slotContext = await appointmentRepository.getSlotBookingContext(
      tenantIdResult.data,
      payloadResult.data.doctorId,
      payloadResult.data.doctorRotaId,
      payloadResult.data.slotDate
    );

    if (!slotContext) {
      return {
        success: false,
        errors: ['Doctor slot is Invalid.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (!isValidSlotSelection(slotContext, payloadResult.data.slotTimes)) {
      return {
        success: false,
        errors: ['Selected Doctor slots must exist and be consecutive.'],
      };
    }

    if (
      !isFutureSlotSelection(
        payloadResult.data.slotDate,
        payloadResult.data.slotTimes[0],
        tenant.timeZone
      )
    ) {
      return { success: false, errors: ['Selected Doctor slots must be in the future.'] };
    }

    const reserved = await appointmentRepository.getReservedSlotTimes(
      tenantIdResult.data,
      payloadResult.data.doctorId,
      payloadResult.data.slotDate,
      payloadResult.data.slotTimes,
      { excludeAppointmentId: idResult.data }
    );

    if (reserved.length > 0) {
      return {
        success: false,
        errors: ['One or more selected Doctor slots are no longer available.'],
        status: StatusCodes.CONFLICT,
      };
    }
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
      timeZone: tenant.timeZone,
      ...payloadResult.data,
    },
  };
}
