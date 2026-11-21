import { describe, expect, it } from 'vitest';

import {
  createAdmitSourceSchema,
  updateAdmitSourceSchema,
  admitSourceIdSchema,
  admitSourceTenantIdSchema,
} from './admit-source-schema';

const errorsOf = (result: ReturnType<typeof createAdmitSourceSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AdmitSource schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAdmitSourceSchema.safeParse({ code: 'DOCREF' }))).toContain(
      'Admit source name is required'
    );
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createAdmitSourceSchema.safeParse({ name: 'Doctor Referral' }))).toContain(
      'Admit source code is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createAdmitSourceSchema.safeParse({ name: '   ', code: 'DOCREF' }))).toContain(
      'Admit source name cannot be empty'
    );
  });

  it('should return validation error when name exceeds 100 characters', () => {
    expect(
      errorsOf(createAdmitSourceSchema.safeParse({ name: 'a'.repeat(101), code: 'DOCREF' }))
    ).toContain('Admit source name must be at most 100 characters');
  });

  it('should return validation error when code exceeds 10 characters', () => {
    expect(
      errorsOf(createAdmitSourceSchema.safeParse({ name: 'Doctor Referral', code: 'a'.repeat(11) }))
    ).toContain('Admit source code must be at most 10 characters');
  });

  it('should uppercase code and trim fields on successful parse', () => {
    expect(createAdmitSourceSchema.parse({ name: ' Doctor Referral ', code: ' docref ' })).toEqual({
      name: 'Doctor Referral',
      code: 'DOCREF',
      description: undefined,
    });
  });

  it('should transform blank description to undefined', () => {
    expect(
      createAdmitSourceSchema.parse({ name: 'Doctor Referral', code: 'DOCREF', description: '   ' })
        .description
    ).toBeUndefined();
  });

  it('should transform null description to undefined', () => {
    expect(
      createAdmitSourceSchema.parse({ name: 'Doctor Referral', code: 'DOCREF', description: null })
        .description
    ).toBeUndefined();
  });

  it('should keep a provided description', () => {
    expect(
      createAdmitSourceSchema.parse({
        name: 'Doctor Referral',
        code: 'DOCREF',
        description: ' Referred by an external Doctor ',
      }).description
    ).toBe('Referred by an external Doctor');
  });

  it('should accept the same shape for update as for create', () => {
    expect(updateAdmitSourceSchema.parse({ name: 'Clinic Referral', code: 'clinref' })).toEqual({
      name: 'Clinic Referral',
      code: 'CLINREF',
      description: undefined,
    });
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(
        createAdmitSourceSchema.safeParse({
          name: 'Doctor Referral',
          code: 'DOCREF',
          description: 'a'.repeat(501),
        })
      )
    ).toContain('Admit source description must be at most 500 characters');
  });

  it('should validate id is a positive integer and tenant id is non-empty', () => {
    expect(admitSourceIdSchema.safeParse('0').success).toBe(false);
    expect(admitSourceIdSchema.safeParse('-1').success).toBe(false);
    expect(admitSourceIdSchema.safeParse('1.5').success).toBe(false);
    expect(admitSourceIdSchema.safeParse('abc').success).toBe(false);
    expect(admitSourceIdSchema.parse('7')).toBe(7);
    expect(admitSourceTenantIdSchema.safeParse('   ').success).toBe(false);
    expect(admitSourceTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(createAdmitSourceSchema.safeParse({ name: 'In.Person', code: 'INP' }))
    ).toContain(
      'Admit source name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(createAdmitSourceSchema.safeParse({ name: 'In Person', code: 'IN.P' }))
    ).toContain('Admit source code must contain only letters, numbers, hyphens, and underscores.');
  });
});
