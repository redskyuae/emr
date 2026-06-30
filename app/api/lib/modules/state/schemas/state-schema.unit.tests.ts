import { describe, expect, it } from 'vitest';

import { createStateSchema, stateIdSchema } from './state-schema';

const errorsOf = (result: ReturnType<typeof createStateSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('State schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createStateSchema.safeParse({ countryId: 1 }))).toContain(
      'State name is required'
    );
  });

  it('should return validation error when name is not a string', () => {
    expect(errorsOf(createStateSchema.safeParse({ name: 123, countryId: 1 }))).toContain(
      'State name must be a string'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createStateSchema.safeParse({ name: '   ', countryId: 1 }))).toContain(
      'State name cannot be empty'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createStateSchema.safeParse({ name: 'a'.repeat(101), countryId: 1 }))
    ).toContain('State name must be at most 100 characters');
  });

  it('should return validation error when countryId is missing', () => {
    expect(errorsOf(createStateSchema.safeParse({ name: 'Maharashtra' }))).toContain(
      'country Id is required'
    );
  });

  it('should return validation error when countryId is a string', () => {
    expect(
      errorsOf(createStateSchema.safeParse({ name: 'Maharashtra', countryId: '1' }))
    ).toContain('country Id must be integer');
  });

  it('should return validation error when countryId is not an integer', () => {
    expect(
      errorsOf(createStateSchema.safeParse({ name: 'Maharashtra', countryId: 1.5 }))
    ).toContain('country Id must be integer');
  });

  it('should return validation error when countryId is not positive', () => {
    expect(errorsOf(createStateSchema.safeParse({ name: 'Maharashtra', countryId: 0 }))).toContain(
      'country Id must be positive'
    );
  });

  it('should trim name and accept a valid payload', () => {
    expect(createStateSchema.parse({ name: ' Maharashtra ', countryId: 1 })).toEqual({
      name: ' Maharashtra ',
      countryId: 1,
    });
  });

  it('should validate state id is positive integer', () => {
    expect(stateIdSchema.safeParse('1').success).toBe(true);
    expect(stateIdSchema.safeParse('0').success).toBe(false);
    expect(stateIdSchema.safeParse('abc').success).toBe(false);
  });
});
