import { describe, expect, it } from 'vitest';

import {
  createTherapistSchema,
  therapistListParamsSchema,
  updateTherapistSchema,
} from './therapist-schema';

describe('Therapist schema', () => {
  it('requires name, email, and password when creating', () => {
    const result = createTherapistSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining(['Name is required', 'Email is required', 'Password is required'])
    );
  });

  it('trims optional fields and accepts zero or more skills', () => {
    expect(
      createTherapistSchema.parse({
        name: ' Anita ',
        email: 'a@example.com',
        password: 'password123',
        therapistSkillIds: [],
      })
    ).toMatchObject({ name: 'Anita', therapistSkillIds: [] });
  });

  it('allows clearing optional update fields', () => {
    expect(updateTherapistSchema.parse({ qualifications: '', therapistSkillIds: [] })).toEqual({
      qualifications: null,
      therapistSkillIds: [],
    });
  });

  it('parses list filters', () => {
    expect(
      therapistListParamsSchema.parse({ tenantId: ' tenant-1 ', page: '2', status: 'inactive' })
    ).toMatchObject({ tenantId: 'tenant-1', page: 2, status: 'inactive' });
  });
});
