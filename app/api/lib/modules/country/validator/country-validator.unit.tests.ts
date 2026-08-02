import { describe, expect, it } from 'vitest';

import { getCountryUniqueConstraintErrors } from './country-uniqueness-validator';

import { validateCountryId } from './country-id-validator';
import { validateCreateCountry } from './create-country-validator';
import { validateUpdateCountry } from './update-country-validator';

describe('Country validators', () => {
  it('should return schema errors when create payload is invalid', () => {
    expect(validateCreateCountry({})).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Country name is required']),
    });
  });

  it('should return parsed/transformed data on create success', () => {
    expect(validateCreateCountry({ name: ' India ', code: 'ind' })).toEqual({
      success: true,
      data: { name: 'India', code: 'IND' },
    });
  });

  it('should return schema errors when update payload is invalid', () => {
    expect(validateUpdateCountry({ name: 'India' })).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Country code is required']),
    });
  });

  it('should return parsed data on update success', () => {
    expect(validateUpdateCountry({ name: 'India', code: 'ind' })).toEqual({
      success: true,
      data: { name: 'India', code: 'IND' },
    });
  });

  it('should accept a valid id', () => {
    expect(validateCountryId('5')).toEqual({ success: true, data: 5 });
  });

  it('should return invalid-id error with the submitted value', () => {
    expect(validateCountryId('abc')).toEqual({
      success: false,
      errors: ['Country abc is Invalid.'],
    });
  });
});

describe('getCountryUniqueConstraintErrors', () => {
  const input = { name: 'India', code: 'IND' };

  it('should map a Drizzle-wrapped name constraint violation to the duplicate name error', () => {
    const wrapped = new Error('insert failed', {
      cause: { code: '23505', constraint: 'country_name_idx' },
    });

    expect(getCountryUniqueConstraintErrors(wrapped, input)).toEqual([
      'Country name India already exists.',
    ]);
  });

  it('should map an unwrapped code constraint violation to the duplicate code error', () => {
    expect(
      getCountryUniqueConstraintErrors({ code: '23505', constraint: 'country_code_idx' }, input)
    ).toEqual(['Country code IND already exists.']);
  });

  it('should return no errors for a unique violation on an unrelated constraint', () => {
    expect(
      getCountryUniqueConstraintErrors({ code: '23505', constraint: 'country_other_idx' }, input)
    ).toEqual([]);
  });

  it('should return no errors for a database error that is not a unique violation', () => {
    expect(getCountryUniqueConstraintErrors({ cause: { code: '23503' } }, input)).toEqual([]);
  });

  it('should return no errors for a non-database error', () => {
    expect(getCountryUniqueConstraintErrors(new Error('database down'), input)).toEqual([]);
  });
});
