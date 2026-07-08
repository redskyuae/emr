import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { doctorRepository } from '../repository/doctor-repository';
import type { Doctor, DoctorListParams } from '../schemas/doctor-schema';
import { validateGetDoctors } from '../validator/get-doctors-validator';

export async function getDoctorsQuery(params: DoctorListParams): Promise<ListQueryResult<Doctor>> {
  const validationResult = validateGetDoctors(params);

  if (!validationResult.success) {
    return validationResult;
  }

  const { data, total } = await doctorRepository.getDoctors(validationResult.data);

  return { success: true, data, total };
}
