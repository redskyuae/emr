import type { CommandResult } from '@/app/api/lib/utils/types';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import type { DoctorSchedule } from '../schemas/doctor-schedule-schema';
import { validateCreateDoctorSchedule } from '../validator/create-doctor-schedule-validator';

export async function createDoctorScheduleCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<DoctorSchedule>> {
  const validationResult = await validateCreateDoctorSchedule(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const createdSchedule = await doctorScheduleRepository.createDoctorSchedule({
    ...validationResult.data,
    tenantId,
  });

  return { success: true, data: createdSchedule };
}
