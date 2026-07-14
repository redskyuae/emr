import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import type { DoctorSchedule } from '../schemas/doctor-schedule-schema';
import { validateGetDoctorSchedules } from '../validator/get-doctor-schedules-validator';

export async function getDoctorSchedulesQuery(
  params: unknown
): Promise<ListQueryResult<DoctorSchedule>> {
  const validationResult = validateGetDoctorSchedules(params);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await doctorScheduleRepository.getDoctorSchedules(validationResult.data);

  return { success: true, data, total };
}
