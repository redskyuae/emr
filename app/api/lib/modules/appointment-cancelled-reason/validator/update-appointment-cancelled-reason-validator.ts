import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import {
  appointmentCancelledReasonIdSchema,
  type UpdateAppointmentCancelledReasonInput,
  updateAppointmentCancelledReasonSchema,
} from '../schemas/appointment-cancelled-reason-schema';
import { validateAppointmentCancelledReasonUniqueness } from './appointment-cancelled-reason-uniqueness-validator';

export type UpdateAppointmentCancelledReasonParams = {
  id: number;
  payload: UpdateAppointmentCancelledReasonInput;
};

export async function validateUpdateAppointmentCancelledReason(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAppointmentCancelledReasonParams>> {
  const idResult = appointmentCancelledReasonIdSchema.safeParse(id);
  const payloadResult = updateAppointmentCancelledReasonSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment cancelled reason ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAppointmentCancelledReason =
    await appointmentCancelledReasonRepository.getAppointmentCancelledReasonById(
      idResult.data,
      tenantId
    );

  if (!existingAppointmentCancelledReason) {
    return {
      success: false,
      errors: ['Appointment cancelled reason not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAppointmentCancelledReasonUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
