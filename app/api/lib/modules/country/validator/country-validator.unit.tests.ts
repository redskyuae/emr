import { describe, expect, it } from 'vitest';

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
