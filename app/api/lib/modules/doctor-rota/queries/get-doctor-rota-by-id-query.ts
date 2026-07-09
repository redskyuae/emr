import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import type { DoctorRota } from '../schemas/doctor-rota-schema';
import { validateGetDoctorRotaById } from '../validator/get-doctor-rota-by-id-validator';

export async function getDoctorRotaByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<DoctorRota>> {
  const validationResult = validateGetDoctorRotaById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const doctorRota = await doctorRotaRepository.getDoctorRotaById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!doctorRota) {
    return {
      success: false,
      errors: ['Doctor rota not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: doctorRota };
}
