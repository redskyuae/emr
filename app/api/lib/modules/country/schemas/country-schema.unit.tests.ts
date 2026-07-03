import { describe, expect, it } from 'vitest';

import { countryIdSchema, createCountrySchema } from './country-schema';

const errorsOf = (result: ReturnType<typeof createCountrySchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Country schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createCountrySchema.safeParse({ code: 'IND' }))).toContain(
      'Country name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createCountrySchema.safeParse({ name: '   ', code: 'IND' }))).toContain(
      'Country name cannot be empty'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createCountrySchema.safeParse({ name: 'a'.repeat(101), code: 'IND' }))
    ).toContain('Country name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createCountrySchema.safeParse({ name: 'India' }))).toContain(
      'Country code is required'
    );
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createCountrySchema.safeParse({ name: 'India', code: 'A'.repeat(11) }))
    ).toContain('Country code must be at most 10 characters');
  });

  it('should uppercase and trim code on successful parse', () => {
    expect(createCountrySchema.parse({ name: ' India ', code: ' ind ' })).toEqual({
      name: 'India',
      code: 'IND',
    });
  });

  it('should validate country id is positive integer', () => {
    expect(countryIdSchema.safeParse('1').success).toBe(true);
    expect(countryIdSchema.safeParse('0').success).toBe(false);
    expect(countryIdSchema.safeParse('1.5').success).toBe(false);
    expect(countryIdSchema.safeParse('abc').success).toBe(false);
  });
});
