import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import type { DoctorRota } from '../schemas/doctor-rota-schema';
import { validateDeleteDoctorRota } from '../validator/delete-doctor-rota-validator';

export async function deleteDoctorRotaCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<DoctorRota>> {
  const validationResult = validateDeleteDoctorRota(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedDoctorRota = await doctorRotaRepository.deleteDoctorRota(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedDoctorRota) {
    return {
      success: false,
      errors: ['Doctor rota not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedDoctorRota };
}
