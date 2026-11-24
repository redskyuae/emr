import { describe, expect, it } from 'vitest';

import { describeUserAgent, parseUserAgent } from './user-agent';

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.100 Safari/537.36';
const EDGE_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.70';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

describe('parseUserAgent', () => {
  it('should read browser, major version, operating system and device type', () => {
    expect(parseUserAgent(CHROME_MAC)).toEqual({
      browser: 'Chrome',
      browserVersion: '156',
      os: 'macOS',
      deviceType: 'Desktop',
    });
    expect(parseUserAgent(SAFARI_IPHONE)).toMatchObject({
      browser: 'Safari',
      os: 'iOS',
      deviceType: 'Mobile',
    });
    expect(parseUserAgent(CHROME_ANDROID_TABLET)).toMatchObject({
      os: 'Android',
      deviceType: 'Tablet',
    });
  });

  it('should not mistake Edge for Chrome', () => {
    expect(parseUserAgent(EDGE_WINDOWS)).toMatchObject({ browser: 'Edge', os: 'Windows' });
  });

  it('should report nothing for a missing user agent', () => {
    expect(parseUserAgent(null)).toEqual({
      browser: null,
      browserVersion: null,
      os: null,
      deviceType: null,
    });
  });
});

describe('describeUserAgent', () => {
  it('should describe a device in a few words', () => {
    expect(describeUserAgent(CHROME_MAC)).toBe('Chrome 156 on macOS');
    expect(describeUserAgent('curl/8.4.0')).toBe('Other device');
    expect(describeUserAgent(undefined)).toBeNull();
  });
});
