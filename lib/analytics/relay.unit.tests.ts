import { describe, expect, it } from 'vitest';

import { buildRelayRequestHeaders, buildRelayResponseHeaders, buildRelayTarget } from './relay';

const settings = {
  host: 'https://eu.i.posthog.com',
  assetsHost: 'https://eu-assets.i.posthog.com',
};

describe('buildRelayTarget', () => {
  it('should send ingestion paths to the ingestion host with their trailing slash', () => {
    expect(buildRelayTarget(settings, ['e'], '?ip=0&ver=1.453.2')).toBe(
      'https://eu.i.posthog.com/e/?ip=0&ver=1.453.2'
    );
    expect(buildRelayTarget(settings, ['i', 'v0', 'e'], '')).toBe(
      'https://eu.i.posthog.com/i/v0/e/'
    );
  });

  it('should send asset paths to the asset host', () => {
    expect(buildRelayTarget(settings, ['static', 'array.js'], '')).toBe(
      'https://eu-assets.i.posthog.com/static/array.js'
    );
    expect(buildRelayTarget(settings, ['array', 'phc_x', 'config.js'], '')).toBe(
      'https://eu-assets.i.posthog.com/array/phc_x/config.js'
    );
  });

  it('should keep the upstream host whatever the path holds', () => {
    expect(new URL(buildRelayTarget(settings, ['..', '..', 'evil.example.com'], '')).host).toBe(
      'eu.i.posthog.com'
    );
    expect(new URL(buildRelayTarget(settings, ['@evil.example.com'], '')).host).toBe(
      'eu.i.posthog.com'
    );
  });
});

describe('buildRelayRequestHeaders', () => {
  it('should never forward the session cookie, the referrer or the client address', () => {
    const headers = buildRelayRequestHeaders(
      new Headers({
        cookie: 'better-auth.session_token=secret; other=1',
        referer: 'https://emr.example.com/patients/42?q=Asha',
        'x-forwarded-for': '203.0.113.7',
        authorization: 'Bearer secret',
        'content-type': 'text/plain',
      })
    );

    expect([...headers.entries()]).toEqual([['content-type', 'text/plain']]);
  });
});

describe('buildRelayResponseHeaders', () => {
  it('should never pass a cookie back to the browser', () => {
    const headers = buildRelayResponseHeaders(
      new Headers({ 'set-cookie': 'ph=1', 'content-type': 'application/json' })
    );

    expect([...headers.entries()]).toEqual([['content-type', 'application/json']]);
  });
});
