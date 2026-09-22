import { describe, expect, it, vi } from 'vitest';

import { therapistRepository } from '../repository/therapist-repository';
import { getTherapistUniqueConstraintErrors, validateTherapistRegistrationUniqueness } from './therapist-uniqueness-validator';

vi.mock('../repository/therapist-repository', () => ({ therapistRepository: { findActiveByRegistrationNumber: vi.fn() } }));

describe('Therapist uniqueness validation', () => {
  it('skips empty registration numbers', async () => {
    await expect(validateTherapistRegistrationUniqueness('tenant-1', '')).resolves.toEqual({ success: true, data: undefined });
  });

  it('returns a conflict when registration number is already active', async () => {
    vi.mocked(therapistRepository.findActiveByRegistrationNumber).mockResolvedValue({ id: 3 } as never);
    const result = await validateTherapistRegistrationUniqueness('tenant-1', 'REG-1');
    expect(result.success).toBe(false);
  });

  it('maps the registration unique constraint', () => {
    expect(getTherapistUniqueConstraintErrors({ code: '23505', constraint: 'therapist_tenant_registration_number_idx' }, 'REG-1')).toEqual(['Therapist registration number REG-1 already exists.']);
  });
});
