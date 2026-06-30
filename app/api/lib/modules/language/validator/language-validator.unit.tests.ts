import { describe, expect, it } from 'vitest';

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
