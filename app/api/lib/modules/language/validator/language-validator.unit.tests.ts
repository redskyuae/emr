import { describe, expect, it } from 'vitest';

import { getLanguageUniqueConstraintErrors } from './language-uniqueness-validator';

import { validateLanguageId } from './language-id-validator';
import { validateCreateLanguage } from './create-language-validator';
import { validateUpdateLanguage } from './update-language-validator';

describe('Language validators', () => {
  it('should return schema errors when create payload is invalid', () => {
    expect(validateCreateLanguage({})).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Language name is required']),
    });
  });

  it('should return parsed/transformed data on create success', () => {
    expect(validateCreateLanguage({ name: ' English ', code: 'en' })).toEqual({
      success: true,
      data: { name: 'English', code: 'EN' },
    });
  });

  it('should return schema errors when update payload is invalid', () => {
    expect(validateUpdateLanguage({ name: 'English' })).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Language code is required']),
    });
  });

  it('should return parsed data on update success', () => {
    expect(validateUpdateLanguage({ name: 'English', code: 'en' })).toEqual({
      success: true,
      data: { name: 'English', code: 'EN' },
    });
  });

  it('should accept a valid id', () => {
    expect(validateLanguageId('5')).toEqual({ success: true, data: 5 });
  });

  it('should return invalid-id error with the submitted value', () => {
    expect(validateLanguageId('abc')).toEqual({
      success: false,
      errors: ['LanguageId abc is Invalid.'],
    });
  });
});

describe('getLanguageUniqueConstraintErrors', () => {
  const input = { name: 'English', code: 'EN' };

  it('should map a Drizzle-wrapped name constraint violation to the duplicate name error', () => {
    const wrapped = new Error('insert failed', {
      cause: { code: '23505', constraint: 'language_name_idx' },
    });

    expect(getLanguageUniqueConstraintErrors(wrapped, input)).toEqual([
      'Language name English already exists.',
    ]);
  });

  it('should map an unwrapped code constraint violation to the duplicate code error', () => {
    expect(
      getLanguageUniqueConstraintErrors({ code: '23505', constraint: 'language_code_idx' }, input)
    ).toEqual(['Language code EN already exists.']);
  });

  it('should return no errors for a unique violation on an unrelated constraint', () => {
    expect(
      getLanguageUniqueConstraintErrors({ code: '23505', constraint: 'language_other_idx' }, input)
    ).toEqual([]);
  });

  it('should return no errors for a database error that is not a unique violation', () => {
    expect(getLanguageUniqueConstraintErrors({ cause: { code: '23503' } }, input)).toEqual([]);
  });

  it('should return no errors for a non-database error', () => {
    expect(getLanguageUniqueConstraintErrors(new Error('database down'), input)).toEqual([]);
  });
});
