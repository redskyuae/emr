import type { ValidationResult } from '@/app/api/lib/utils/types';
import { doctorListParamsSchema, type DoctorListParams } from '../schemas/doctor-schema';

export function validateGetDoctors(params: unknown): ValidationResult<DoctorListParams> {
  const result = doctorListParamsSchema.safeParse(params);

  if (!result.success) {
    return { success: false, errors: result.error.issues.map((issue) => issue.message) };
  }

  return { success: true, data: result.data };
}
