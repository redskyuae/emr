import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { doctorRepository } from '../repository/doctor-repository';
import type { Doctor } from '../schemas/doctor-schema';
import { validateDoctorExists } from '../validator/doctor-exists-validator';

export async function deactivateDoctorCommand(
  id: unknown,
  tenantId: string
): Promise<CommandResult<Doctor>> {
  const validationResult = await validateDoctorExists(id, tenantId);

  if (!validationResult.success) {
    return validationResult;
  }

  const doctor = await doctorRepository.setDoctorActive(validationResult.data.id, tenantId, false);

  if (!doctor) {
    return { success: false, errors: ['Doctor not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: doctor };
}
