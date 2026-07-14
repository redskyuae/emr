import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { updateDoctorScheduleSchema } from '../schemas/doctor-schedule-schema';
import type { UpdateDoctorScheduleInput } from '../schemas/doctor-schedule-schema';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';

export async function validateUpdateDoctorSchedule(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateDoctorScheduleInput>> {
  const result = updateDoctorScheduleSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const existingSchedule = await doctorScheduleRepository.getDoctorScheduleById(
    result.data.id,
    tenantId
  );

  if (!existingSchedule) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Doctor schedule not found'],
    };
  }

  if (result.data.payload.doctorId !== undefined) {
    const doctor = await doctorRepository.getDoctorById(result.data.payload.doctorId, tenantId);

    if (!doctor || !doctor.isActive) {
      return {
        success: false,
        errors: [`Doctor ${result.data.payload.doctorId} is Invalid.`],
      };
    }
  }

  if (result.data.payload.rotaIds !== undefined) {
    const activeRotaCount = await doctorScheduleRepository.getActiveRotaCount(
      tenantId,
      result.data.payload.rotaIds
    );

    if (activeRotaCount !== new Set(result.data.payload.rotaIds).size) {
      return {
        success: false,
        errors: ['One or more Doctor rotas are invalid.'],
      };
    }
  }

  return { success: true, data: result.data };
}
