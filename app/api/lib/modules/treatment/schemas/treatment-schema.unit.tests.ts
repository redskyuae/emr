import { describe, expect, it } from 'vitest';

import {
  createTreatmentSchema,
  treatmentIdSchema,
  treatmentSessionIdSchema,
  treatmentTenantIdSchema,
  updateTreatmentSchema,
} from './treatment-schema';

const session = {
  label: 'Session 1 of 6 · Abhyanga + Swedana',
  procedure: 'Abhyanga + Swedana',
  sessionNumber: 1,
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
};

const validPayload = {
  name: 'Abhyanga wellness programme',
  code: 'trt-0400',
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
  roomType: 'Panchakarma room',
  therapistSkill: 'Abhyanga',
  sessions: [session],
};

const errorsOf = (result: ReturnType<typeof createTreatmentSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Treatment schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createTreatmentSchema.safeParse({ code: 'TRT-0400', sessions: [session] }))
    ).toContain('Treatment name is required');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(
        createTreatmentSchema.safeParse({
          name: 'Abhyanga wellness programme',
          sessions: [session],
        })
      )
    ).toContain('Treatment code is required');
  });

  it('should return validation error when sessions are missing', () => {
    expect(
      errorsOf(
        createTreatmentSchema.safeParse({
          name: 'Abhyanga wellness programme',
          code: 'TRT-0400',
          durationMinutes: 60,
        })
      )
    ).toContain('Sessions are required');
  });

  it('should require at least one Session', () => {
    expect(errorsOf(createTreatmentSchema.safeParse({ ...validPayload, sessions: [] }))).toContain(
      'At least one Session is required'
    );
  });

  it('should reject duplicate Session numbers', () => {
    expect(
      errorsOf(createTreatmentSchema.safeParse({ ...validPayload, sessions: [session, session] }))
    ).toContain('Session numbers must be unique');
  });

  it('should uppercase code and trim fields on successful parse', () => {
    expect(
      createTreatmentSchema.parse({ ...validPayload, name: ' Abhyanga wellness programme ' })
    ).toMatchObject({
      name: 'Abhyanga wellness programme',
      code: 'TRT-0400',
      setupMinutes: 10,
      cleaningMinutes: 5,
    });
  });

  it('should default omitted setup and cleaning minutes to zero', () => {
    expect(
      createTreatmentSchema.parse({
        name: 'Abhyanga wellness programme',
        code: 'TRT-0400',
        durationMinutes: 60,
        sessions: [
          {
            label: 'Session 1 of 1 · Abhyanga',
            procedure: 'Abhyanga',
            sessionNumber: 1,
            durationMinutes: 45,
          },
        ],
      })
    ).toMatchObject({
      setupMinutes: 0,
      cleaningMinutes: 0,
      sessions: [{ setupMinutes: 0, cleaningMinutes: 0 }],
    });
  });

  it('should transform blank optional text to undefined', () => {
    expect(
      createTreatmentSchema.parse({
        ...validPayload,
        description: '   ',
        roomType: '',
        therapistSkill: null,
      })
    ).toMatchObject({
      description: undefined,
      roomType: undefined,
      therapistSkill: undefined,
    });
  });

  it('should reject a Treatment name longer than 200 characters', () => {
    expect(
      errorsOf(createTreatmentSchema.safeParse({ ...validPayload, name: 'a'.repeat(201) }))
    ).toContain('Treatment name must be at most 200 characters');
  });

  it('should reject a Treatment code longer than 20 characters', () => {
    expect(
      errorsOf(createTreatmentSchema.safeParse({ ...validPayload, code: 'a'.repeat(21) }))
    ).toContain('Treatment code must be at most 20 characters');
  });

  it('should accept Ayurveda combo names with plus signs', () => {
    expect(
      createTreatmentSchema.parse({
        ...validPayload,
        name: 'Abhyangam + Swedanam + Bandanam',
        code: 'damc0003',
      }).name
    ).toBe('Abhyangam + Swedanam + Bandanam');
  });

  it('should accept protocol punctuation used in Ayurveda catalogues', () => {
    expect(
      createTreatmentSchema.parse({
        ...validPayload,
        name: 'Sarvangadhara {Thailam, Ksheeram}',
      }).name
    ).toBe('Sarvangadhara {Thailam, Ksheeram}');
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(createTreatmentSchema.safeParse({ ...validPayload, name: 'Abhyanga@home' }))
    ).toContain(
      'Treatment name must contain only letters, numbers, spaces, and common punctuation used in protocol names.'
    );
    expect(
      errorsOf(createTreatmentSchema.safeParse({ ...validPayload, code: 'TRT.0400' }))
    ).toContain('Treatment code must contain only letters, numbers, hyphens, and underscores.');
  });

  it('should not accept sessions on update', () => {
    expect(
      updateTreatmentSchema.safeParse({
        name: 'Abhyanga wellness programme',
        code: 'TRT-0400',
        durationMinutes: 60,
        sessions: [session],
      }).success
    ).toBe(false);
  });

  it('should accept the header fields for update', () => {
    expect(
      updateTreatmentSchema.parse({
        name: 'Abhyanga wellness programme',
        code: 'trt-0400',
        durationMinutes: 60,
      })
    ).toMatchObject({
      name: 'Abhyanga wellness programme',
      code: 'TRT-0400',
      setupMinutes: 0,
      cleaningMinutes: 0,
    });
  });

  it('should validate ids are positive integers and tenant id is non-empty', () => {
    expect(treatmentIdSchema.safeParse('0').success).toBe(false);
    expect(treatmentSessionIdSchema.safeParse('-1').success).toBe(false);
    expect(treatmentIdSchema.parse('7')).toBe(7);
    expect(treatmentTenantIdSchema.safeParse('   ').success).toBe(false);
    expect(treatmentTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
  });
});
