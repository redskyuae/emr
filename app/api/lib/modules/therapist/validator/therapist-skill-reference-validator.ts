import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../../therapist-skill/repository/therapist-skill-repository';

export async function validateTherapistSkillReferences(
  ids: number[],
  tenantId: string
): Promise<ValidationResult<void>> {
  const uniqueIds = [...new Set(ids)];
  const skills = await therapistSkillRepository.getActiveSkillsByIds(uniqueIds, tenantId);
  if (skills.length !== uniqueIds.length) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['One or more Therapist Skills are Invalid.'],
    };
  }
  return { success: true, data: undefined };
}
