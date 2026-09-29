import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadIsFeatureFlagOn(value: string | undefined) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_HIDE_AUTH_BRAND_PANEL', value);
  const { isFeatureFlagOn } = await import('./feature-flags');
  return isFeatureFlagOn;
}

describe('feature flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should treat an unset or empty flag as off', async () => {
    expect((await loadIsFeatureFlagOn(undefined))('hideAuthBrandPanel')).toBe(false);
    expect((await loadIsFeatureFlagOn(''))('hideAuthBrandPanel')).toBe(false);
    expect((await loadIsFeatureFlagOn('   '))('hideAuthBrandPanel')).toBe(false);
  });

  it('should treat true or 1 as on, ignoring case and surrounding whitespace', async () => {
    expect((await loadIsFeatureFlagOn('true'))('hideAuthBrandPanel')).toBe(true);
    expect((await loadIsFeatureFlagOn(' TRUE '))('hideAuthBrandPanel')).toBe(true);
    expect((await loadIsFeatureFlagOn('1'))('hideAuthBrandPanel')).toBe(true);
  });

  it('should treat any other value as off', async () => {
    expect((await loadIsFeatureFlagOn('false'))('hideAuthBrandPanel')).toBe(false);
    expect((await loadIsFeatureFlagOn('0'))('hideAuthBrandPanel')).toBe(false);
    expect((await loadIsFeatureFlagOn('yes'))('hideAuthBrandPanel')).toBe(false);
  });
});
