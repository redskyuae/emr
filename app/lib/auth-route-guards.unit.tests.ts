import { describe, expect, it } from 'vitest';

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getHomePathForUser,
  getSafeNextPath,
  isPublicPagePath,
} from './auth-route-guards';

describe('auth route guards', () => {
  it('should treat only the entry, marketing, auth, and Swagger pages as public', () => {
    expect(isPublicPagePath('/')).toBe(true);
    expect(isPublicPagePath('/site')).toBe(true);
    expect(isPublicPagePath('/site/')).toBe(true);
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

  it('should send a Doctor with Visit permission straight to Visits', () => {
    expect(getHomePathForUser({ roles: [{ code: 'DOCTOR' }], permissions: ['visit:read'] })).toBe(
      '/visits'
    );
    expect(
      getHomePathForUser({
        roles: [{ code: 'THERAPIST' }, { code: 'DOCTOR' }],
        permissions: ['appointment:read', 'visit:read'],
      })
    ).toBe('/visits');
  });

  it('should send everyone else, and a Doctor without Visit permission, to the dashboard', () => {
    expect(
      getHomePathForUser({
        roles: [{ code: 'DOCTOR' }],
        permissions: ['dashboard:read', 'patient:read'],
      })
    ).toBe(DEFAULT_AUTH_REDIRECT_PATH);
    expect(
      getHomePathForUser({
        roles: [{ code: 'THERAPIST' }],
        permissions: ['dashboard:read', 'visit:read'],
      })
    ).toBe(DEFAULT_AUTH_REDIRECT_PATH);
    expect(getHomePathForUser({ roles: [], permissions: ['dashboard:read', 'visit:read'] })).toBe(
      DEFAULT_AUTH_REDIRECT_PATH
    );
  });

  it('should send a user without dashboard:read to the first page they can open', () => {
    expect(
      getHomePathForUser({ roles: [], permissions: ['patient:read', 'appointment:read'] })
    ).toBe('/appointments');
    expect(getHomePathForUser({ roles: [], permissions: ['patient:read', 'visit:read'] })).toBe(
      '/visits'
    );
    expect(getHomePathForUser({ roles: [], permissions: ['patient:read'] })).toBe('/patients');
    expect(getHomePathForUser({ roles: [], permissions: ['therapist:read'] })).toBe(
      DEFAULT_AUTH_REDIRECT_PATH
    );
  });
});
