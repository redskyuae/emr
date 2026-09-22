import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { therapistSkillRepository } from '../repository/therapist-skill-repository';

type Input = { name: string; code?: string; tenantId: string; excludeId?: number };

export async function validateTherapistSkillUniqueness({
  name,
  code,
  tenantId,
  excludeId,
}: Input): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    therapistSkillRepository.findActiveByName(tenantId, name, { excludeId }),
    code
      ? therapistSkillRepository.findActiveByCode(tenantId, code, { excludeId })
      : Promise.resolve(undefined),
  ]);
  const errors: string[] = [];

  if (existingName) errors.push(`Therapist Skill name ${name} already exists.`);
  if (existingCode && code) errors.push(`Therapist Skill code ${code} already exists.`);

  return errors.length > 0
    ? { success: false, errors, status: StatusCodes.CONFLICT }
    : { success: true, data: undefined };
}

export function getTherapistSkillUniqueConstraintErrors(
  error: unknown,
  input: Pick<Input, 'name' | 'code'>
) {
  if (
    typeof error !== 'object' ||
    error === null ||
    (error as { code?: string }).code !== '23505'
  ) {
    return [];
  }

  const constraint = (error as { constraint?: string }).constraint;
  if (constraint === 'therapist_skill_tenant_name_idx') {
    return [`Therapist Skill name ${input.name} already exists.`];
  }
  if (constraint === 'therapist_skill_tenant_code_idx' && input.code) {
    return [`Therapist Skill code ${input.code} already exists.`];
  }
  return [];
}
