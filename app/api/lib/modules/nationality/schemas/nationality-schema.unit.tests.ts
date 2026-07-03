import { describe, expect, it } from 'vitest';

import { nationalityIdSchema, createNationalitySchema } from './nationality-schema';

const errorsOf = (result: ReturnType<typeof createNationalitySchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Nationality schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createNationalitySchema.safeParse({ code: 'IND' }))).toContain(
      'Nationality name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createNationalitySchema.safeParse({ name: '   ', code: 'IND' }))).toContain(
      'Nationality name cannot be empty'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createNationalitySchema.safeParse({ name: 'a'.repeat(101), code: 'IND' }))
    ).toContain('Nationality name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createNationalitySchema.safeParse({ name: 'Indian' }))).toContain(
      'Nationality code is required'
    );
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createNationalitySchema.safeParse({ name: 'Indian', code: 'A'.repeat(11) }))
    ).toContain('Nationality code must be at most 10 characters');
  });

  it('should uppercase and trim code on successful parse', () => {
    expect(createNationalitySchema.parse({ name: ' Indian ', code: ' ind ' })).toEqual({
      name: 'Indian',
      code: 'IND',
    });
  });

  it('should validate nationality id is positive integer', () => {
    expect(nationalityIdSchema.safeParse('1').success).toBe(true);
    expect(nationalityIdSchema.safeParse('0').success).toBe(false);
    expect(nationalityIdSchema.safeParse('1.5').success).toBe(false);
    expect(nationalityIdSchema.safeParse('abc').success).toBe(false);
  });
});
