import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { doctorScheduleListParamsSchema } from '../schemas/doctor-schedule-schema';
import type { DoctorScheduleListParams } from '../schemas/doctor-schedule-schema';

export function validateGetDoctorSchedules(
  params: unknown
): ValidationResult<DoctorScheduleListParams> {
  const result = doctorScheduleListParamsSchema.safeParse(params);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
