import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { doctorRepository } from '../repository/doctor-repository';
import type { Doctor } from '../schemas/doctor-schema';
import { validateGetDoctorById } from './get-doctor-by-id-validator';

export async function validateDoctorExists(
  id: unknown,
  tenantId: string
): Promise<ValidationResult<Doctor>> {
  const idResult = validateGetDoctorById(id, tenantId);

  if (!idResult.success) {
    return idResult;
  }

  const doctor = await doctorRepository.getDoctorById(idResult.data.id, idResult.data.tenantId);

  if (!doctor) {
    return { success: false, errors: ['Doctor not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: doctor };
}
