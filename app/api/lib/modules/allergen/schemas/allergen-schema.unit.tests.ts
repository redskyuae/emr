import { describe, expect, it } from 'vitest';

import { allergenIdSchema, allergenTenantIdSchema, createAllergenSchema } from './allergen-schema';

const errorsOf = (result: ReturnType<typeof createAllergenSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Allergen schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAllergenSchema.safeParse({ code: 'PEN', category: 'drug' }))).toContain(
      'Allergen name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createAllergenSchema.safeParse({ name: '   ', code: 'PEN', category: 'drug' }))
    ).toContain('Allergen name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createAllergenSchema.safeParse({ name: 'a'.repeat(151), code: 'PEN', category: 'drug' })
      )
    ).toContain('Allergen name must be at most 150 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createAllergenSchema.safeParse({ name: 'Penicillin', category: 'drug' }))
    ).toContain('Allergen code is required');
  });

  it('should return validation error when category is invalid', () => {
    expect(
      errorsOf(
        createAllergenSchema.safeParse({ name: 'Penicillin', code: 'PEN', category: 'bogus' })
      )
    ).toContain('Allergen category is invalid');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createAllergenSchema.parse({ name: 'Penicillin', code: 'pen', category: 'drug' }).code
    ).toBe('PEN');
  });

  it('should trim name/code on successful parse', () => {
    expect(
      createAllergenSchema.parse({ name: ' Penicillin ', code: ' pen ', category: 'drug' })
    ).toEqual({
      name: 'Penicillin',
      code: 'PEN',
      category: 'drug',
    });
  });

  it('should validate allergen id is positive integer', () => {
    expect(allergenIdSchema.safeParse('1').success).toBe(true);
    expect(allergenIdSchema.safeParse('0').success).toBe(false);
    expect(allergenIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(allergenTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(allergenTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(createAllergenSchema.safeParse({ name: 'In.Person', code: 'INP', category: 'drug' }))
    ).toContain(
      'Allergen name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(
        createAllergenSchema.safeParse({ name: 'In Person', code: 'IN.P', category: 'drug' })
      )
    ).toContain('Allergen code must contain only letters, numbers, hyphens, and underscores.');
  });
});
