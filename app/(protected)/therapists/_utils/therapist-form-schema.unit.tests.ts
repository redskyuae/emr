import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { therapistFormSchema } from './therapist-form-schema';

const validTherapistForm = {
  name: 'Anjali Nair',
  email: 'anjali@example.com',
  password: 'password123',
  dateOfBirth: '1990-04-12',
  therapistSkillIds: [],
};

describe('therapistFormSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reject a date of birth in the future', () => {
    const result = therapistFormSchema.safeParse({
      ...validTherapistForm,
      dateOfBirth: '2026-10-01',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ['dateOfBirth'],
        message: 'Date of birth cannot be in the future.',
      })
    );
  });

  it('should accept a date of birth of today', () => {
    const result = therapistFormSchema.safeParse({
      ...validTherapistForm,
      dateOfBirth: '2026-09-30',
    });

    expect(result.success).toBe(true);
  });

  it('should accept a date of birth in the past', () => {
    expect(therapistFormSchema.safeParse(validTherapistForm).success).toBe(true);
  });

  it('should accept an empty date of birth', () => {
    const result = therapistFormSchema.safeParse({ ...validTherapistForm, dateOfBirth: '' });

    expect(result.success).toBe(true);
  });
});
