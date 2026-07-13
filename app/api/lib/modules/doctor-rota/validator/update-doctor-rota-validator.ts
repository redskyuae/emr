import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  doctorRotaIdSchema,
  type UpdateDoctorRotaInput,
  updateDoctorRotaSchema,
} from '../schemas/doctor-rota-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import { validateDoctorRotaUniqueness } from './doctor-rota-uniqueness-validator';

export type UpdateDoctorRotaParams = {
  id: number;
  payload: UpdateDoctorRotaInput;
};

export async function validateUpdateDoctorRota(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateDoctorRotaParams>> {
  const idResult = doctorRotaIdSchema.safeParse(id);
  const payloadResult = updateDoctorRotaSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Doctor rota ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingDoctorRota = await doctorRotaRepository.getDoctorRotaById(idResult.data, tenantId);

  if (!existingDoctorRota) {
    return {
      success: false,
      errors: ['Doctor rota not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateDoctorRotaUniqueness({
    name: payloadResult.data.name,
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
