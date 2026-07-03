import { describe, expect, it } from 'vitest';

import { permissionIdSchema } from './permission-schema';

describe('Permission schema', () => {
  it('should coerce and accept a positive integer id', () => {
    expect(permissionIdSchema.safeParse('5')).toMatchObject({ success: true, data: 5 });
  });

  it('should reject a zero or negative id', () => {
    expect(permissionIdSchema.safeParse('0').success).toBe(false);
    expect(permissionIdSchema.safeParse('-1').success).toBe(false);
  });

  it('should reject a non-integer id', () => {
    expect(permissionIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should reject a non-numeric id', () => {
    expect(permissionIdSchema.safeParse('abc').success).toBe(false);
  });
});
