import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { doctorRepository } from '../repository/doctor-repository';
import type { Doctor } from '../schemas/doctor-schema';
import { validateGetDoctorById } from '../validator/get-doctor-by-id-validator';

export async function getDoctorByIdQuery(
  id: unknown,
  tenantId: string
): Promise<SingleQueryResult<Doctor>> {
  const validationResult = validateGetDoctorById(id, tenantId);

  if (!validationResult.success) {
    return validationResult;
  }

  const doctor = await doctorRepository.getDoctorById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!doctor) {
    return { success: false, errors: ['Doctor not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: doctor };
}
