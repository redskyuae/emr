import { describe, expect, it } from 'vitest';

import { validatePermissionId } from './permission-id-validator';

describe('Permission validators', () => {
  it('should accept a valid id', () => {
    expect(validatePermissionId('7')).toEqual({ success: true, data: 7 });
  });

  it('should return invalid-id error with the submitted value', () => {
    expect(validatePermissionId('abc')).toEqual({
      success: false,
      errors: ['Permission abc is Invalid.'],
    });
  });
});
