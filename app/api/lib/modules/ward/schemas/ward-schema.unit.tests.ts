import { describe, expect, it } from 'vitest';

import {
  createWardSchema,
  updateWardSchema,
  wardIdSchema,
  wardTenantIdSchema,
} from './ward-schema';

const errorsOf = (result: ReturnType<typeof createWardSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Ward schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createWardSchema.safeParse({ code: 'GEN' }))).toContain(
      'Ward name is required'
    );
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createWardSchema.safeParse({ name: 'General Ward' }))).toContain(
      'Ward code is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createWardSchema.safeParse({ name: '   ', code: 'GEN' }))).toContain(
      'Ward name cannot be empty'
    );
  });

  it('should return validation error when name exceeds 100 characters', () => {
    expect(errorsOf(createWardSchema.safeParse({ name: 'a'.repeat(101), code: 'GEN' }))).toContain(
      'Ward name must be at most 100 characters'
    );
  });

  it('should return validation error when code exceeds 10 characters', () => {
    expect(
      errorsOf(createWardSchema.safeParse({ name: 'General Ward', code: 'a'.repeat(11) }))
    ).toContain('Ward code must be at most 10 characters');
  });

  it('should uppercase code and trim fields on successful parse', () => {
    expect(createWardSchema.parse({ name: ' General Ward ', code: ' gen ' })).toEqual({
      name: 'General Ward',
      code: 'GEN',
      description: undefined,
    });
  });

  it('should transform blank description to undefined', () => {
    expect(
      createWardSchema.parse({ name: 'General Ward', code: 'GEN', description: '   ' }).description
    ).toBeUndefined();
  });

  it('should transform null description to undefined', () => {
    expect(
      createWardSchema.parse({ name: 'General Ward', code: 'GEN', description: null }).description
    ).toBeUndefined();
  });

  it('should keep a provided description', () => {
    expect(
      createWardSchema.parse({
        name: 'General Ward',
        code: 'GEN',
        description: ' Standard outpatient consultation ',
      }).description
    ).toBe('Standard outpatient consultation');
  });

  it('should accept the same shape for update as for create', () => {
    expect(updateWardSchema.parse({ name: 'Maternity', code: 'mat' })).toEqual({
      name: 'Maternity',
      code: 'MAT',
      description: undefined,
    });
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(
        createWardSchema.safeParse({
          name: 'General Ward',
          code: 'GEN',
          description: 'a'.repeat(501),
        })
      )
    ).toContain('Ward description must be at most 500 characters');
  });

  it('should validate id is a positive integer and tenant id is non-empty', () => {
    expect(wardIdSchema.safeParse('0').success).toBe(false);
    expect(wardIdSchema.safeParse('-1').success).toBe(false);
    expect(wardIdSchema.safeParse('1.5').success).toBe(false);
    expect(wardIdSchema.safeParse('abc').success).toBe(false);
    expect(wardIdSchema.parse('7')).toBe(7);
    expect(wardTenantIdSchema.safeParse('   ').success).toBe(false);
    expect(wardTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
  });

  it('should reject unsupported characters in name and code', () => {
    expect(errorsOf(createWardSchema.safeParse({ name: 'In.Person', code: 'INP' }))).toContain(
      'Ward name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(errorsOf(createWardSchema.safeParse({ name: 'In Person', code: 'IN.P' }))).toContain(
      'Ward code must contain only letters, numbers, hyphens, and underscores.'
    );
  });
});
