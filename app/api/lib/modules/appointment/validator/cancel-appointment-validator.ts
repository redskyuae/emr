import { StatusCodes } from 'http-status-codes';

import { appointmentCancelledReasonRepository } from '../../appointment-cancelled-reason/repository/appointment-cancelled-reason-repository';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentRepository } from '../repository/appointment-repository';
import {
  appointmentIdSchema,
  appointmentTenantIdSchema,
  cancelAppointmentSchema,
  type ValidatedCancelAppointmentData,
} from '../schemas/appointment-schema';

export async function validateCancelAppointment(
  id: unknown,
  payload: unknown,
  tenantId: unknown
): Promise<ValidationResult<ValidatedCancelAppointmentData>> {
  const idResult = appointmentIdSchema.safeParse(id);
  const tenantIdResult = appointmentTenantIdSchema.safeParse(tenantId);
  const payloadResult = cancelAppointmentSchema.safeParse(payload);

  if (!idResult.success || !tenantIdResult.success || !payloadResult.success) {
    return {
      success: false,
      errors: [
        ...(idResult.success ? [] : formatValidationErrors(idResult.error)),
        ...(tenantIdResult.success ? [] : formatValidationErrors(tenantIdResult.error)),
        ...(payloadResult.success ? [] : formatValidationErrors(payloadResult.error)),
      ],
    };
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
      errors: ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    };
  }

  const cancellationReason =
    await appointmentCancelledReasonRepository.getAppointmentCancelledReasonById(
      payloadResult.data.appointmentCancelledReasonId,
      tenantIdResult.data
    );

  if (!cancellationReason) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Appointment Cancelled Reason is not available.'],
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
      appointmentCancelledReasonId: payloadResult.data.appointmentCancelledReasonId,
    },
  };
}
