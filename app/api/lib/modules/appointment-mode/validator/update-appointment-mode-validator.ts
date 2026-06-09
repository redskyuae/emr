import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAppointmentModeInput,
  updateAppointmentModeSchema,
  appointmentModeIdSchema,
} from '../schemas/appointment-mode-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import { validateAppointmentModeUniqueness } from './appointment-mode-uniqueness-validator';

export type UpdateAppointmentModeParams = {
  id: number;
  payload: UpdateAppointmentModeInput;
};

const NOT_FOUND_STATUS = 404;

export async function validateUpdateAppointmentMode(
  id: unknown,
  payload: unknown
): Promise<ValidationResult<UpdateAppointmentModeParams>> {
  const idResult = appointmentModeIdSchema.safeParse(id);
  const payloadResult = updateAppointmentModeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment mode ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAppointmentMode = await appointmentModeRepository.getAppointmentModeById(
    idResult.data,
    payloadResult.data.tenantId
  );

  if (!existingAppointmentMode) {
    return {
      success: false,
      errors: ['Appointment mode not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const uniquenessResult = await validateAppointmentModeUniqueness({
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
