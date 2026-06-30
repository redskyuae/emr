import { describe, expect, it } from 'vitest';

import { validateReligionId } from './religion-id-validator';
import { validateCreateReligion } from './create-religion-validator';
import { validateUpdateReligion } from './update-religion-validator';

describe('Religion validators', () => {
  it('should return schema errors when create payload is invalid', () => {
    expect(validateCreateReligion({})).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Religion name is required']),
    });
  });

  it('should return parsed/transformed data on create success', () => {
    expect(validateCreateReligion({ name: ' Hindu ', code: 'hin' })).toEqual({
      success: true,
      data: { name: 'Hindu', code: 'HIN' },
    });
  });

  it('should return schema errors when update payload is invalid', () => {
    expect(validateUpdateReligion({ name: 'Hindu' })).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Religion code is required']),
    });
  });

  it('should return parsed data on update success', () => {
    expect(validateUpdateReligion({ name: 'Hindu', code: 'hin' })).toEqual({
      success: true,
      data: { name: 'Hindu', code: 'HIN' },
    });
  });

  it('should accept a valid id', () => {
    expect(validateReligionId('5')).toEqual({ success: true, data: 5 });
  });

  it('should return invalid-id error with the submitted value', () => {
    expect(validateReligionId('abc')).toEqual({
      success: false,
      errors: ['Religion abc is Invalid.'],
    });
  });
});
