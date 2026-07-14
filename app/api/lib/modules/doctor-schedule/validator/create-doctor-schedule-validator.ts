import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { createDoctorScheduleSchema } from '../schemas/doctor-schedule-schema';
import type { CreateDoctorScheduleInput } from '../schemas/doctor-schedule-schema';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';

export async function validateCreateDoctorSchedule(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateDoctorScheduleInput>> {
  const result = createDoctorScheduleSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const doctor = await doctorRepository.getDoctorById(result.data.doctorId, tenantId);

  if (!doctor || !doctor.isActive) {
    return {
      success: false,
      errors: [`Doctor ${result.data.doctorId} is Invalid.`],
    };
  }

  const activeRotaCount = await doctorScheduleRepository.getActiveRotaCount(
    tenantId,
    result.data.rotaIds
  );

  if (activeRotaCount !== new Set(result.data.rotaIds).size) {
    return {
      success: false,
      errors: ['One or more Doctor rotas are invalid.'],
    };
  }

  return { success: true, data: result.data };
}
