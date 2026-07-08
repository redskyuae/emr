import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { doctorRepository } from '../repository/doctor-repository';
import type { Doctor } from '../schemas/doctor-schema';
import { getDoctorUniqueConstraintErrors } from '../validator/doctor-uniqueness-validator';
import { validateUpdateDoctor } from '../validator/update-doctor-validator';

export async function updateDoctorCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Doctor>> {
  const validationResult = await validateUpdateDoctor(id, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const doctor = await doctorRepository.updateDoctor(validationResult.data.id, {
      ...validationResult.data.payload,
      tenantId,
    });

    if (!doctor) {
      return { success: false, errors: ['Doctor not found'], status: StatusCodes.NOT_FOUND };
    }

    return { success: true, data: doctor };
  } catch (error) {
    const constraintErrors = getDoctorUniqueConstraintErrors(error, validationResult.data.payload);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
