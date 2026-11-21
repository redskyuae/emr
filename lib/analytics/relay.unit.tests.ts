import { describe, expect, it } from 'vitest';

import {
  buildRelayRequestHeaders,
  buildRelayResponseHeaders,
  buildRelayTarget,
  readRelayBody,
} from './relay';

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

describe('readRelayBody', () => {
  function streamOf(chunks: string[]) {
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });
  }

  it('should return a body within the limit unchanged', async () => {
    const request = new Request('http://localhost/relay/e/', {
      method: 'POST',
      body: streamOf(['{"batch":', '[]}']),
      duplex: 'half',
    } as RequestInit);

    const body = await readRelayBody(request, 64);

    expect(new TextDecoder().decode(body ?? undefined)).toBe('{"batch":[]}');
  });

  it('should refuse a declared length over the limit without reading', async () => {
    const request = new Request('http://localhost/relay/e/', {
      method: 'POST',
      headers: { 'content-length': '2048' },
      body: 'x'.repeat(2048),
    });

    expect(await readRelayBody(request, 1024)).toBeNull();
    expect(request.bodyUsed).toBe(false);
  });

  it('should stop reading a streamed body once it passes the limit', async () => {
    const request = new Request('http://localhost/relay/e/', {
      method: 'POST',
      body: streamOf(['x'.repeat(600), 'x'.repeat(600)]),
      duplex: 'half',
    } as RequestInit);

    expect(await readRelayBody(request, 1024)).toBeNull();
  });
});
