import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createTherapistSchema, type CreateTherapistInput } from '../schemas/therapist-schema';
import { validateTherapistRegistrationUniqueness } from './therapist-uniqueness-validator';
import { validateTherapistSkillReferences } from './therapist-skill-reference-validator';

export async function validateCreateTherapist(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateTherapistInput>> {
  const result = createTherapistSchema.safeParse(payload);
  if (!result.success) return { success: false, errors: formatValidationErrors(result.error) };
  const [registration, skills] = await Promise.all([
    validateTherapistRegistrationUniqueness(tenantId, result.data.registrationNumber),
    validateTherapistSkillReferences(result.data.therapistSkillIds, tenantId),
  ]);
  if (!registration.success) return registration;
  if (!skills.success) return skills;
  return { success: true, data: result.data };
}
