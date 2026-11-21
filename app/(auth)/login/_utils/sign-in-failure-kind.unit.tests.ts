import { describe, expect, it } from 'vitest';

import { signInFailureKind } from './sign-in-failure-kind';

describe('signInFailureKind', () => {
  it('should classify a rejected sign-in by its status', () => {
    expect(signInFailureKind(401)).toBe('invalid_credentials');
    expect(signInFailureKind(403)).toBe('no_active_tenant');
    expect(signInFailureKind(409)).toBe('multiple_active_tenants');
    expect(signInFailureKind(400)).toBe('other');
    expect(signInFailureKind(undefined)).toBe('other');
  });
});
