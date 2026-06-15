import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentTypeIdSchema,
  type UpdateAppointmentTypeInput,
  updateAppointmentTypeSchema,
} from '../schemas/appointment-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import { validateAppointmentTypeUniqueness } from './appointment-type-uniqueness-validator';

export type UpdateAppointmentTypeParams = {
  id: number;
  payload: UpdateAppointmentTypeInput;
};

export async function validateUpdateAppointmentType(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAppointmentTypeParams>> {
  const idResult = appointmentTypeIdSchema.safeParse(id);
  const payloadResult = updateAppointmentTypeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Appointment type ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAppointmentType = await appointmentTypeRepository.getAppointmentTypeById(
    idResult.data,
    tenantId
  );

  if (!existingAppointmentType) {
    return {
      success: false,
      errors: ['Appointment type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAppointmentTypeUniqueness({
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
