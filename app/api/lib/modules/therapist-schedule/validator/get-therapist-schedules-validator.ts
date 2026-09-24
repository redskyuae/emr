import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  therapistScheduleListParamsSchema,
  type TherapistScheduleListParams,
} from '../schemas/therapist-schedule-schema';

export function validateGetTherapistSchedules(
  params: unknown
): ValidationResult<TherapistScheduleListParams> {
  const result = therapistScheduleListParamsSchema.safeParse(params);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: formatValidationErrors(result.error) };
}
