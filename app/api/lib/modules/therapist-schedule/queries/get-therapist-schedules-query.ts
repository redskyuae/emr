import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import type { TherapistSchedule } from '../schemas/therapist-schedule-schema';
import { validateGetTherapistSchedules } from '../validator/get-therapist-schedules-validator';

export async function getTherapistSchedulesQuery(
  params: unknown
): Promise<ListQueryResult<TherapistSchedule>> {
  const validation = validateGetTherapistSchedules(params);
  if (!validation.success) return validation;
  const { data, total } = await therapistScheduleRepository.getTherapistSchedules(validation.data);
  return { success: true, data, total };
}
