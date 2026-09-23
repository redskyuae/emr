import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  therapistSkillIdSchema,
  therapistSkillTenantIdSchema,
} from '../schemas/therapist-skill-schema';

export function validateGetTherapistSkillById(
  id: unknown,
  tenantId: unknown
): ValidationResult<{ id: number; tenantId: string }> {
  const idResult = therapistSkillIdSchema.safeParse(id);
  const tenantResult = therapistSkillTenantIdSchema.safeParse(tenantId);
  if (!idResult.success || !tenantResult.success) {
    return {
      success: false,
      errors: [
        ...(idResult.success ? [] : [`Therapist Skill ${String(id)} is Invalid.`]),
        ...(tenantResult.success ? [] : ['Tenant ID is required']),
      ],
    };
  }
  return { success: true, data: { id: idResult.data, tenantId: tenantResult.data } };
}
