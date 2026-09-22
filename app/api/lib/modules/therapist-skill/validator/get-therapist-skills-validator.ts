import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  therapistSkillListParamsSchema,
  type TherapistSkillListParams,
} from '../schemas/therapist-skill-schema';

export function validateGetTherapistSkills(
  input: unknown
): ValidationResult<TherapistSkillListParams> {
  const result = therapistSkillListParamsSchema.safeParse(input);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: formatValidationErrors(result.error) };
}
