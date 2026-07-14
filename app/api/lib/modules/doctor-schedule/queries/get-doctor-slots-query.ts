import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import type { DoctorSlotDate } from '../schemas/doctor-schedule-schema';
import { validateGetDoctorSlots } from '../validator/get-doctor-slots-validator';

export async function getDoctorSlotsQuery(
  params: unknown
): Promise<ListQueryResult<DoctorSlotDate>> {
  const validationResult = validateGetDoctorSlots(params);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const data = await doctorScheduleRepository.getDoctorSlots(
    validationResult.data.tenantId,
    validationResult.data.doctorId,
    validationResult.data.slotDate
  );

  return { success: true, data, total: data.length };
}
