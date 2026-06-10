import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAppointmentStatusInput,
  updateAppointmentStatusSchema,
  appointmentStatusIdSchema,
} from '../schemas/appointment-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import { validateAppointmentStatusUniqueness } from './appointment-status-uniqueness-validator';

export type UpdateAppointmentStatusParams = {
  id: number;
  payload: UpdateAppointmentStatusInput;
};

const NOT_FOUND_STATUS = 404;

export async function validateUpdateAppointmentStatus(
  id: unknown,
  payload: unknown
): Promise<ValidationResult<UpdateAppointmentStatusParams>> {
  const idResult = appointmentStatusIdSchema.safeParse(id);
  const payloadResult = updateAppointmentStatusSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment status ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAppointmentStatus = await appointmentStatusRepository.getAppointmentStatusById(
    idResult.data,
    payloadResult.data.tenantId
  );

  if (!existingAppointmentStatus) {
    return {
      success: false,
      errors: ['Appointment status not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const uniquenessResult = await validateAppointmentStatusUniqueness({
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
