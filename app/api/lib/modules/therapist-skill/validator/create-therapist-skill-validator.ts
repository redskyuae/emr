import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createTherapistSkillSchema,
  type CreateTherapistSkillInput,
} from '../schemas/therapist-skill-schema';
import { validateTherapistSkillUniqueness } from './therapist-skill-uniqueness-validator';

export async function validateCreateTherapistSkill(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateTherapistSkillInput>> {
  const result = createTherapistSkillSchema.safeParse(payload);
  if (!result.success) return { success: false, errors: formatValidationErrors(result.error) };
  const uniqueness = await validateTherapistSkillUniqueness({ ...result.data, tenantId });
  return uniqueness.success
    ? { success: true, data: result.data }
    : { success: false, errors: uniqueness.errors, status: uniqueness.status };
}
