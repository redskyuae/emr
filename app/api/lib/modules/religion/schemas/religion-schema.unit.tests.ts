import { describe, expect, it } from 'vitest';

import { religionIdSchema, createReligionSchema } from './religion-schema';

const errorsOf = (result: ReturnType<typeof createReligionSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Religion schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createReligionSchema.safeParse({ code: 'HIN' }))).toContain(
      'Religion name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createReligionSchema.safeParse({ name: '   ', code: 'HIN' }))).toContain(
      'Religion name cannot be empty'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createReligionSchema.safeParse({ name: 'a'.repeat(101), code: 'HIN' }))
    ).toContain('Religion name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createReligionSchema.safeParse({ name: 'Hindu' }))).toContain(
      'Religion code is required'
    );
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createReligionSchema.safeParse({ name: 'Hindu', code: 'A'.repeat(11) }))
    ).toContain('Religion code must be at most 10 characters');
  });

  it('should uppercase and trim code on successful parse', () => {
    expect(createReligionSchema.parse({ name: ' Hindu ', code: ' hin ' })).toEqual({
      name: 'Hindu',
      code: 'HIN',
    });
  });

  it('should validate religion id is positive integer', () => {
    expect(religionIdSchema.safeParse('1').success).toBe(true);
    expect(religionIdSchema.safeParse('0').success).toBe(false);
    expect(religionIdSchema.safeParse('1.5').success).toBe(false);
    expect(religionIdSchema.safeParse('abc').success).toBe(false);
  });
});
