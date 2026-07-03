import { describe, expect, it } from 'vitest';

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
