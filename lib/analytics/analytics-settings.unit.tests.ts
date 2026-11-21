import { describe, expect, it } from 'vitest';

import {
  getAnalyticsSettings,
  getClientAnalyticsSettings,
  getSidebarMode,
} from './analytics-settings';

describe('getAnalyticsSettings', () => {
  it('should be off unless the switch is true and a key is set', () => {
    expect(getAnalyticsSettings({})).toBeNull();
    expect(getAnalyticsSettings({ ANALYTICS_ENABLED: 'true' })).toBeNull();
    expect(
      getAnalyticsSettings({ ANALYTICS_ENABLED: 'false', POSTHOG_PROJECT_KEY: 'phc_x' })
    ).toBeNull();
    expect(
      getAnalyticsSettings({ ANALYTICS_ENABLED: 'true', POSTHOG_PROJECT_KEY: '  ' })
    ).toBeNull();
  });

  it('should default to PostHog Cloud EU', () => {
    expect(
      getAnalyticsSettings({ ANALYTICS_ENABLED: 'true', POSTHOG_PROJECT_KEY: 'phc_x' })
    ).toEqual({
      projectKey: 'phc_x',
      host: 'https://eu.i.posthog.com',
      assetsHost: 'https://eu-assets.i.posthog.com',
      uiHost: 'https://eu.posthog.com',
    });
  });

  it('should use a configured host as is', () => {
    expect(
      getAnalyticsSettings({
        ANALYTICS_ENABLED: 'true',
        POSTHOG_PROJECT_KEY: 'phc_x',
        POSTHOG_HOST: 'https://ph.internal.example.com/',
      })
    ).toEqual({
      projectKey: 'phc_x',
      host: 'https://ph.internal.example.com',
      assetsHost: 'https://ph.internal.example.com',
      uiHost: 'https://ph.internal.example.com',
    });
  });
});

describe('getClientAnalyticsSettings', () => {
  it('should send the browser to the same-origin relay', () => {
    expect(
      getClientAnalyticsSettings({ ANALYTICS_ENABLED: 'true', POSTHOG_PROJECT_KEY: 'phc_x' })
    ).toEqual({ projectKey: 'phc_x', apiHost: '/relay', uiHost: 'https://eu.posthog.com' });
    expect(getClientAnalyticsSettings({})).toBeNull();
  });
});

describe('getSidebarMode', () => {
  it('should follow the two sidebar settings', () => {
    expect(getSidebarMode({})).toBe('appointments_only');
    expect(getSidebarMode({ SIDEBAR_SHOW_VISITS: 'true' })).toBe('appointments_and_visits');
    expect(
      getSidebarMode({ SIDEBAR_APPOINTMENTS_ONLY: 'false', SIDEBAR_SHOW_VISITS: 'true' })
    ).toBe('full');
  });
});
