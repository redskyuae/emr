import { describe, expect, it } from 'vitest';

import { DEFAULT_AUTH_REDIRECT_PATH, getSafeNextPath, isPublicPagePath } from './auth-route-guards';

describe('auth route guards', () => {
  it('should treat only the marketing, auth, and Swagger pages as public', () => {
    expect(isPublicPagePath('/')).toBe(true);
    expect(isPublicPagePath('/login')).toBe(true);
    expect(isPublicPagePath('/signup')).toBe(true);
    expect(isPublicPagePath('/swagger')).toBe(true);

    expect(isPublicPagePath('/dashboard')).toBe(false);
    expect(isPublicPagePath('/assets-management/inventory')).toBe(false);
    expect(isPublicPagePath('/some-typo-route')).toBe(false);
  });

  it('should preserve safe same-site next destinations with query strings', () => {
    expect(getSafeNextPath('/assets-management/inventory?page=2&status=active')).toBe(
      '/assets-management/inventory?page=2&status=active'
    );
  });

  it('should reject unsafe or non-page next destinations', () => {
    const unsafeNextValues = [
      undefined,
      'https://evil.example/dashboard',
      '//evil.example/dashboard',
      '/login',
      '/signup?next=/assets-management/inventory',
      '/api/v1/users',
      '/_next/static/chunk.js',
      '/favicon.ico',
      '/logo.png',
      String.raw`/dashboard\evil`,
    ];

    for (const value of unsafeNextValues) {
      expect(getSafeNextPath(value)).toBe(DEFAULT_AUTH_REDIRECT_PATH);
    }
  });
});
