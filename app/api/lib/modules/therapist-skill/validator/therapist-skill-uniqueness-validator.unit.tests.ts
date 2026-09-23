import { describe, expect, it, vi } from 'vitest';

import { therapistSkillRepository } from '../repository/therapist-skill-repository';
import {
  getTherapistSkillUniqueConstraintErrors,
  validateTherapistSkillUniqueness,
} from './therapist-skill-uniqueness-validator';

vi.mock('../repository/therapist-skill-repository', () => ({
  therapistSkillRepository: { findActiveByName: vi.fn(), findActiveByCode: vi.fn() },
}));

describe('Therapist skill uniqueness validation', () => {
  it('reports duplicate name and code', async () => {
    vi.mocked(therapistSkillRepository.findActiveByName).mockResolvedValue({ id: 1 } as never);
    vi.mocked(therapistSkillRepository.findActiveByCode).mockResolvedValue({ id: 2 } as never);
    const result = await validateTherapistSkillUniqueness({
      tenantId: 'tenant-1',
      name: 'Abhyanga',
      code: 'AB',
    });
    expect(result).toMatchObject({ success: false, status: 409 });
    expect(result.success ? [] : result.errors).toHaveLength(2);
  });

  it('maps known unique constraints', () => {
    expect(
      getTherapistSkillUniqueConstraintErrors(
        { code: '23505', constraint: 'therapist_skill_tenant_code_idx' },
        { name: 'Abhyanga', code: 'AB' }
      )
    ).toEqual(['Therapist Skill code AB already exists.']);
  });
});
