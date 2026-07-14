import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import type { DoctorSchedule } from '../schemas/doctor-schedule-schema';
import { validateUpdateDoctorSchedule } from '../validator/update-doctor-schedule-validator';

export async function updateDoctorScheduleCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<DoctorSchedule>> {
  const validationResult = await validateUpdateDoctorSchedule(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const updatedSchedule = await doctorScheduleRepository.updateDoctorSchedule(
    validationResult.data.id,
    {
      ...validationResult.data.payload,
      tenantId,
    }
  );

  if (!updatedSchedule) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Doctor schedule not found'],
    };
  }

  return { success: true, data: updatedSchedule };
}
