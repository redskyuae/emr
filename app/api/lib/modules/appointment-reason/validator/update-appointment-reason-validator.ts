import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import {
  appointmentReasonIdSchema,
  type UpdateAppointmentReasonInput,
  updateAppointmentReasonSchema,
} from '../schemas/appointment-reason-schema';
import { validateAppointmentReasonUniqueness } from './appointment-reason-uniqueness-validator';

export type UpdateAppointmentReasonParams = {
  id: number;
  payload: UpdateAppointmentReasonInput;
};

export async function validateUpdateAppointmentReason(
  id: unknown,
  payload: unknown
): Promise<ValidationResult<UpdateAppointmentReasonParams>> {
  const idResult = appointmentReasonIdSchema.safeParse(id);
  const payloadResult = updateAppointmentReasonSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment reason ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAppointmentReason = await appointmentReasonRepository.getAppointmentReasonById(
    idResult.data,
    payloadResult.data.tenantId
  );

  if (!existingAppointmentReason) {
    return {
      success: false,
      errors: ['Appointment reason not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAppointmentReasonUniqueness({
    ...payloadResult.data,
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
