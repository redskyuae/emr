import { describe, expect, it } from 'vitest';

import { getReligionUniqueConstraintErrors } from './religion-uniqueness-validator';

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

describe('getReligionUniqueConstraintErrors', () => {
  const input = { name: 'Hindu', code: 'HIN' };

  it('should map a Drizzle-wrapped name constraint violation to the duplicate name error', () => {
    const wrapped = new Error('insert failed', {
      cause: { code: '23505', constraint: 'religion_name_idx' },
    });

    expect(getReligionUniqueConstraintErrors(wrapped, input)).toEqual([
      'Religion name Hindu already exists.',
    ]);
  });

  it('should map an unwrapped code constraint violation to the duplicate code error', () => {
    expect(
      getReligionUniqueConstraintErrors({ code: '23505', constraint: 'religion_code_idx' }, input)
    ).toEqual(['Religion code HIN already exists.']);
  });

  it('should return no errors for a unique violation on an unrelated constraint', () => {
    expect(
      getReligionUniqueConstraintErrors({ code: '23505', constraint: 'religion_other_idx' }, input)
    ).toEqual([]);
  });

  it('should return no errors for a database error that is not a unique violation', () => {
    expect(getReligionUniqueConstraintErrors({ cause: { code: '23503' } }, input)).toEqual([]);
  });

  it('should return no errors for a non-database error', () => {
    expect(getReligionUniqueConstraintErrors(new Error('database down'), input)).toEqual([]);
  });
});
