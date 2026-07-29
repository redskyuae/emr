import { describe, expect, it } from 'vitest';

import {
  nullableToOptionalSimpleMasterDescriptionSchema,
  simpleMasterDescriptionSchema,
  optionalSimpleMasterCodeSchema,
  simpleMasterCodeSchema,
  simpleMasterNameSchema,
} from './simple-master-fields';

describe('simple master field schemas', () => {
  const nameSchema = simpleMasterNameSchema({
    max: 100,
    fieldName: 'Master name',
    emptyMessage: 'Master name cannot be empty',
    maxMessage: 'Master name must be at most 100 characters',
    requiredMessage: 'Master name is required',
  });

  const codeSchema = simpleMasterCodeSchema({
    max: 10,
    fieldName: 'Master code',
    emptyMessage: 'Master code cannot be empty',
    maxMessage: 'Master code must be at most 10 characters',
    requiredMessage: 'Master code is required',
  });

  it('should allow common master name punctuation used by seeded data', () => {
    expect(nameSchema.parse('ENT, Head & Neck (OPD)/Day-care')).toBe(
      'ENT, Head & Neck (OPD)/Day-care'
    );
  });

  it('should reject a dot in a master name', () => {
    expect(nameSchema.safeParse('In.Person').error?.issues.map((issue) => issue.message)).toContain(
      'Master name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );
  });

  it('should reject names without any letters', () => {
    expect(nameSchema.safeParse('---').success).toBe(false);
    expect(nameSchema.safeParse('Home123').success).toBe(false);
    expect(nameSchema.safeParse('12345').success).toBe(false);
  });

  it('should uppercase valid master codes and allow underscores or hyphens', () => {
    expect(codeSchema.parse('ward_mgr-1')).toBe('WARD_MGR-1');
  });

  it('should reject a dot in a master code', () => {
    expect(codeSchema.safeParse('IN.P').error?.issues.map((issue) => issue.message)).toContain(
      'Master code must contain only letters, numbers, hyphens, and underscores.'
    );
  });

  it('should allow optional master codes to be blank', () => {
    const optionalCode = optionalSimpleMasterCodeSchema({
      max: 10,
      fieldName: 'Specialty code',
      maxMessage: 'Specialty code must be at most 10 characters',
    });

    expect(optionalCode.parse('   ')).toBeUndefined();
    expect(optionalCode.parse('card')).toBe('CARD');
  });

  it('should trim optional descriptions and enforce their configured max length', () => {
    const descriptionSchema = simpleMasterDescriptionSchema({
      max: 5,
      maxMessage: 'Description must be at most 5 characters',
    });

    expect(descriptionSchema.parse(' Note ')).toBe('Note');
    expect(descriptionSchema.parse('   ')).toBeUndefined();
    expect(descriptionSchema.safeParse('Too long').error?.issues[0]?.message).toBe(
      'Description must be at most 5 characters'
    );
  });

  it('should normalize nullable descriptions when a backend contract allows null', () => {
    const descriptionSchema = nullableToOptionalSimpleMasterDescriptionSchema({
      max: 5,
      maxMessage: 'Description must be at most 5 characters',
    });

    expect(descriptionSchema.parse(null)).toBeUndefined();
    expect(descriptionSchema.parse(' Note ')).toBe('Note');
    expect(descriptionSchema.safeParse('Too long').error?.issues[0]?.message).toBe(
      'Description must be at most 5 characters'
    );
  });
});
