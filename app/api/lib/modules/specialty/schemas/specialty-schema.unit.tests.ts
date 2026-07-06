import { describe, expect, it } from 'vitest';

import { validateGetSpecialtyById } from '../validator/get-specialty-by-id-validator';
import { getSpecialtyUniqueConstraintErrors } from '../validator/specialty-uniqueness-validator';
import { createSpecialtySchema } from './specialty-schema';

describe('createSpecialtySchema', () => {
  it('should trim text and uppercase a non-empty code', () => {
    const result = createSpecialtySchema.parse({
      name: '  Cardiology  ',
      code: ' card ',
      description: '  Heart and vascular medicine  ',
    });

    expect(result).toEqual({
      name: 'Cardiology',
      code: 'CARD',
      description: 'Heart and vascular medicine',
    });
  });

  it.each([undefined, null, '', '   '])('should normalize code %p to undefined', (code) => {
    const result = createSpecialtySchema.parse({ name: 'Cardiology', code });

    expect(result.code).toBeUndefined();
  });

  it.each([undefined, null, '', '   '])(
    'should normalize description %p to undefined',
    (description) => {
      const result = createSpecialtySchema.parse({ name: 'Cardiology', description });

      expect(result.description).toBeUndefined();
    }
  );

  it('should require a non-empty name no longer than 100 characters', () => {
    expect(createSpecialtySchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(createSpecialtySchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false);
  });

  it('should reject a code longer than 10 characters', () => {
    const result = createSpecialtySchema.safeParse({ name: 'Cardiology', code: 'x'.repeat(11) });

    expect(result.success).toBe(false);
  });

  it('should map database uniqueness races to the exact conflict messages', () => {
    const input = { name: 'Cardiology', code: 'CARD' };

    expect(
      getSpecialtyUniqueConstraintErrors(
        { code: '23505', constraint: 'specialty_tenant_name_idx' },
        input
      )
    ).toEqual(['Specialty name Cardiology already exists.']);
    expect(
      getSpecialtyUniqueConstraintErrors(
        { code: '23505', constraint: 'specialty_tenant_code_idx' },
        input
      )
    ).toEqual(['Specialty code CARD already exists.']);
  });

  it('should use the exact invalid Specialty id wording', () => {
    expect(validateGetSpecialtyById('abc', 'org_apollo')).toEqual({
      success: false,
      errors: ['Specialty abc is Invalid.'],
    });
  });
});
