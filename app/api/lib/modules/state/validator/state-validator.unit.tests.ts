import { describe, expect, it } from 'vitest';

import { getStateUniqueConstraintErrors } from './state-uniqueness-validator';
import { validateCreateState } from './create-state-validator';
import { validateStateCountryId } from './state-country-id-validator';
import { validateStateId } from './state-id-validator';
import { validateUpdateState } from './update-state-validator';

describe('State validators', () => {
  it('should return schema errors when create payload is invalid', () => {
    expect(validateCreateState({})).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['State name is required']),
    });
  });

  it('should return parsed data on create success', () => {
    expect(validateCreateState({ name: 'Maharashtra', countryId: 1 })).toEqual({
      success: true,
      data: { name: 'Maharashtra', countryId: 1 },
    });
  });

  it('should return schema errors when update payload is invalid', () => {
    expect(validateUpdateState({ name: 'Maharashtra' })).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['country Id is required']),
    });
  });

  it('should accept a valid id and reject an invalid one', () => {
    expect(validateStateId('5')).toEqual({ success: true, data: 5 });
    expect(validateStateId('abc')).toEqual({
      success: false,
      errors: ['State abc is Invalid.'],
    });
  });

  it('should validate the country id with its dedicated message', () => {
    expect(validateStateCountryId(3)).toEqual({ success: true, data: 3 });
    expect(validateStateCountryId('3')).toEqual({
      success: false,
      errors: ['countryId: Country ID must be a positive integer'],
    });
  });
});

describe('getStateUniqueConstraintErrors', () => {
  const input = { name: 'Maharashtra' };

  it('should map a Drizzle-wrapped name/country constraint violation to the duplicate error', () => {
    const wrapped = new Error('insert failed', {
      cause: { code: '23505', constraint: 'state_name_country_idx' },
    });

    expect(getStateUniqueConstraintErrors(wrapped, input)).toEqual([
      'State name Maharashtra already exists for the selected country.',
    ]);
  });

  it('should map an unwrapped name/country constraint violation to the duplicate error', () => {
    expect(
      getStateUniqueConstraintErrors({ code: '23505', constraint: 'state_name_country_idx' }, input)
    ).toEqual(['State name Maharashtra already exists for the selected country.']);
  });

  it('should return no errors for a unique violation on an unrelated constraint', () => {
    expect(
      getStateUniqueConstraintErrors({ code: '23505', constraint: 'state_other_idx' }, input)
    ).toEqual([]);
  });

  it('should return no errors for a database error that is not a unique violation', () => {
    expect(getStateUniqueConstraintErrors({ cause: { code: '23503' } }, input)).toEqual([]);
  });

  it('should return no errors for a non-database error', () => {
    expect(getStateUniqueConstraintErrors(new Error('database down'), input)).toEqual([]);
  });
});
