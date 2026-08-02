import { describe, expect, it } from 'vitest';

import { getNationalityUniqueConstraintErrors } from './nationality-uniqueness-validator';

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

describe('getNationalityUniqueConstraintErrors', () => {
  const input = { name: 'Indian', code: 'IND' };

  it('should map a Drizzle-wrapped name constraint violation to the duplicate name error', () => {
    const wrapped = new Error('insert failed', {
      cause: { code: '23505', constraint: 'nationality_name_idx' },
    });

    expect(getNationalityUniqueConstraintErrors(wrapped, input)).toEqual([
      'Nationality name Indian already exists.',
    ]);
  });

  it('should map an unwrapped code constraint violation to the duplicate code error', () => {
    expect(
      getNationalityUniqueConstraintErrors(
        { code: '23505', constraint: 'nationality_code_idx' },
        input
      )
    ).toEqual(['Nationality code IND already exists.']);
  });

  it('should return no errors for a unique violation on an unrelated constraint', () => {
    expect(
      getNationalityUniqueConstraintErrors(
        { code: '23505', constraint: 'nationality_other_idx' },
        input
      )
    ).toEqual([]);
  });

  it('should return no errors for a database error that is not a unique violation', () => {
    expect(getNationalityUniqueConstraintErrors({ cause: { code: '23503' } }, input)).toEqual([]);
  });

  it('should return no errors for a non-database error', () => {
    expect(getNationalityUniqueConstraintErrors(new Error('database down'), input)).toEqual([]);
  });
});
