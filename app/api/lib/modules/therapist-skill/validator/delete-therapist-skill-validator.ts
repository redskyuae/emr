import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import {
  therapistSkillIdSchema,
  therapistSkillTenantIdSchema,
} from '../schemas/therapist-skill-schema';

export async function validateDeleteTherapistSkill(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<{ id: number; tenantId: string }>> {
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
  if (!(await therapistSkillRepository.getTherapistSkillById(idResult.data, tenantResult.data))) {
    return { success: false, errors: ['Therapist Skill not found'], status: StatusCodes.NOT_FOUND };
  }
  return { success: true, data: { id: idResult.data, tenantId: tenantResult.data } };
}
