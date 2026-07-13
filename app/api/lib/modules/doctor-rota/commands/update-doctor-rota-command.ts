import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import type { DoctorRota } from '../schemas/doctor-rota-schema';
import { getDoctorRotaUniqueConstraintErrors } from '../validator/doctor-rota-uniqueness-validator';
import { validateUpdateDoctorRota } from '../validator/update-doctor-rota-validator';

export async function updateDoctorRotaCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<DoctorRota>> {
  const validationResult = await validateUpdateDoctorRota(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const doctorRotaData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedDoctorRota = await doctorRotaRepository.updateDoctorRota(
      validatedId,
      doctorRotaData
    );

    if (!updatedDoctorRota) {
      return {
        success: false,
        errors: ['Doctor rota not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedDoctorRota };
  } catch (error) {
    const constraintErrors = getDoctorRotaUniqueConstraintErrors(error, doctorRotaData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
