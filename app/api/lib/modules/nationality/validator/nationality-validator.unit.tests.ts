import { describe, expect, it } from 'vitest';

import { validateNationalityId } from './nationality-id-validator';
import { validateCreateNationality } from './create-nationality-validator';
import { validateUpdateNationality } from './update-nationality-validator';

describe('Nationality validators', () => {
  it('should return schema errors when create payload is invalid', () => {
    expect(validateCreateNationality({})).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Nationality name is required']),
    });
  });

  it('should return parsed/transformed data on create success', () => {
    expect(validateCreateNationality({ name: ' Indian ', code: 'ind' })).toEqual({
      success: true,
      data: { name: 'Indian', code: 'IND' },
    });
  });

  it('should return schema errors when update payload is invalid', () => {
    expect(validateUpdateNationality({ name: 'Indian' })).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Nationality code is required']),
    });
  });

  it('should return parsed data on update success', () => {
    expect(validateUpdateNationality({ name: 'Indian', code: 'ind' })).toEqual({
      success: true,
      data: { name: 'Indian', code: 'IND' },
    });
  });

  it('should accept a valid id', () => {
    expect(validateNationalityId('5')).toEqual({ success: true, data: 5 });
  });

  it('should return invalid-id error with the submitted value', () => {
    expect(validateNationalityId('abc')).toEqual({
      success: false,
      errors: ['NationalityId abc is Invalid'],
    });
  });
});
