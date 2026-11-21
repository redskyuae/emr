import { describe, expect, it } from 'vitest';

import { signupFailureKind } from './signup-failure-kind';

describe('signupFailureKind', () => {
  it('should classify a rejected signup by its status', () => {
    expect(signupFailureKind(400)).toBe('validation');
    expect(signupFailureKind(409)).toBe('conflict');
    expect(signupFailureKind(500)).toBe('other');
    expect(signupFailureKind(undefined)).toBe('other');
  });
});
