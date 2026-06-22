import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_AUTH_REDIRECT_PATH, getSafeNextPath, isPublicPagePath } from './auth-route-guards';

describe('auth route guards', () => {
  it('treats only the marketing, auth, and Swagger pages as public', () => {
    assert.equal(isPublicPagePath('/'), true);
    assert.equal(isPublicPagePath('/login'), true);
    assert.equal(isPublicPagePath('/signup'), true);
    assert.equal(isPublicPagePath('/swagger'), true);

    assert.equal(isPublicPagePath('/dashboard'), false);
    assert.equal(isPublicPagePath('/assets-management/inventory'), false);
    assert.equal(isPublicPagePath('/some-typo-route'), false);
  });

  it('preserves safe same-site next destinations with query strings', () => {
    assert.equal(
      getSafeNextPath('/assets-management/inventory?page=2&status=active'),
      '/assets-management/inventory?page=2&status=active'
    );
  });

  it('rejects unsafe or non-page next destinations', () => {
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
      '/dashboard\\evil',
    ];

    for (const value of unsafeNextValues) {
      assert.equal(getSafeNextPath(value), DEFAULT_AUTH_REDIRECT_PATH);
    }
  });
});
