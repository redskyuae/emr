import { describe, expect, it } from 'vitest';

import { languageIdSchema, createLanguageSchema } from './language-schema';

const errorsOf = (result: ReturnType<typeof createLanguageSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Language schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createLanguageSchema.safeParse({ code: 'EN' }))).toContain(
      'Language name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createLanguageSchema.safeParse({ name: '   ', code: 'EN' }))).toContain(
      'Language name cannot be empty'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createLanguageSchema.safeParse({ name: 'a'.repeat(101), code: 'EN' }))
    ).toContain('Language name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createLanguageSchema.safeParse({ name: 'English' }))).toContain(
      'Language code is required'
    );
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createLanguageSchema.safeParse({ name: 'English', code: 'A'.repeat(11) }))
    ).toContain('Language code must be at most 10 characters');
  });

  it('should uppercase and trim code on successful parse', () => {
    expect(createLanguageSchema.parse({ name: ' English ', code: ' en ' })).toEqual({
      name: 'English',
      code: 'EN',
    });
  });

  it('should validate language id is positive integer', () => {
    expect(languageIdSchema.safeParse('1').success).toBe(true);
    expect(languageIdSchema.safeParse('0').success).toBe(false);
    expect(languageIdSchema.safeParse('1.5').success).toBe(false);
    expect(languageIdSchema.safeParse('abc').success).toBe(false);
  });
});
