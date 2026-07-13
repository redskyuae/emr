import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import type { DoctorRota } from '../schemas/doctor-rota-schema';
import { getDoctorRotaUniqueConstraintErrors } from '../validator/doctor-rota-uniqueness-validator';
import { validateCreateDoctorRota } from '../validator/create-doctor-rota-validator';

export async function createDoctorRotaCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<DoctorRota>> {
  const validationResult = await validateCreateDoctorRota(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const doctorRotaData = { ...validationResult.data, tenantId };

  try {
    const createdDoctorRota = await doctorRotaRepository.createDoctorRota(doctorRotaData);
    return { success: true, data: createdDoctorRota };
  } catch (error) {
    const constraintErrors = getDoctorRotaUniqueConstraintErrors(error, doctorRotaData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
