import { describe, expect, it } from 'vitest';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import { getTherapistsForSkill } from './therapist-options';

function buildTherapist(overrides: Partial<Therapist> & Pick<Therapist, 'id' | 'name'>): Therapist {
  return {
    email: `${overrides.id}@example.com`,
    phone: null,
    skills: [],
    userId: `user-${overrides.id}`,
    tenantId: 'tenant-1',
    isActive: true,
    staffCode: null,
    designation: null,
    dateOfBirth: null,
    qualifications: null,
    registrationNumber: null,
    gender: null,
    createdOn: new Date('2026-01-01T00:00:00.000Z'),
    modifiedOn: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('Therapist options', () => {
  it('should return active Therapists with the required Therapist Skill ID', () => {
    const therapists = [
      buildTherapist({
        id: 1,
        name: 'Leela',
        skills: [{ id: 11, name: 'Abhyanga', code: 'ABH' }],
      }),
      buildTherapist({
        id: 2,
        name: 'Maya',
        isActive: false,
        skills: [{ id: 11, name: 'Abhyanga', code: 'ABH' }],
      }),
      buildTherapist({
        id: 3,
        name: 'Ravi',
        skills: [{ id: 12, name: 'Shirodhara', code: 'SHI' }],
      }),
    ];

    expect(getTherapistsForSkill(therapists, { id: 11, name: 'Abhyanga' })).toEqual([
      therapists[0],
    ]);
  });

  it('should return no Therapists when the Session has no required skill', () => {
    const therapist = buildTherapist({
      id: 1,
      name: 'Leela',
      skills: [{ id: 11, name: 'Abhyanga', code: 'ABH' }],
    });

    expect(getTherapistsForSkill([therapist], null)).toEqual([]);
  });

  it('should return every active Therapist for a legacy skill label without a Master ID', () => {
    const therapists = [
      buildTherapist({ id: 1, name: 'Leela' }),
      buildTherapist({ id: 2, name: 'Maya', isActive: false }),
    ];

    expect(getTherapistsForSkill(therapists, { id: null, name: 'Abhyanga' })).toEqual([
      therapists[0],
    ]);
  });
});
