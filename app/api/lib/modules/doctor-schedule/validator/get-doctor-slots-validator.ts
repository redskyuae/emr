import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { doctorSlotsParamsSchema } from '../schemas/doctor-schedule-schema';
import type { DoctorSlotsParams } from '../schemas/doctor-schedule-schema';

export function validateGetDoctorSlots(params: unknown): ValidationResult<DoctorSlotsParams> {
  const result = doctorSlotsParamsSchema.safeParse(params);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
