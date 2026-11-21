// Deployment-level analytics configuration, read on the server. The browser never reads these
// variables: the root layout hands `getClientAnalyticsSettings()` to the client provider as a prop,
// the way the brand variant reaches `BrandProvider`.

import type { SidebarMode } from '@/lib/analytics/catalogue';

type Env = Readonly<Record<string, string | undefined>>;

const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

/** Same-origin path the browser sends events to; `app/relay/[...path]/route.ts` forwards them. */
export const ANALYTICS_RELAY_PATH = '/relay';

export type AnalyticsSettings = {
  projectKey: string;
  /** PostHog ingestion host, for example `https://eu.i.posthog.com`. */
  host: string;
  /** PostHog static asset host, for example `https://eu-assets.i.posthog.com`. */
  assetsHost: string;
  /** PostHog app host, used for links PostHog builds, for example `https://eu.posthog.com`. */
  uiHost: string;
};

/** What the browser needs. The project key is public by design: it can only send events. */
export type ClientAnalyticsSettings = {
  projectKey: string;
  apiHost: string;
  uiHost: string;
};

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function derivePostHogHosts(host: string) {
  const cloud = /^https:\/\/(eu|us)\.i\.posthog\.com$/.exec(host);

  if (!cloud) {
    return { assetsHost: host, uiHost: host };
  }

  return {
    assetsHost: `https://${cloud[1]}-assets.i.posthog.com`,
    uiHost: `https://${cloud[1]}.posthog.com`,
  };
}

/**
 * Analytics is on only when `ANALYTICS_ENABLED` is `true` and a project key is set. With it off
 * this returns `null` and nothing is sent, from the browser or the server.
 */
export function getAnalyticsSettings(env: Env = process.env): AnalyticsSettings | null {
  const projectKey = env.POSTHOG_PROJECT_KEY?.trim();

  if (env.ANALYTICS_ENABLED !== 'true' || !projectKey) {
    return null;
  }

  const host = trimTrailingSlash(env.POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST);

  return { projectKey, host, ...derivePostHogHosts(host) };
}

export function getClientAnalyticsSettings(env: Env = process.env): ClientAnalyticsSettings | null {
  const settings = getAnalyticsSettings(env);

  if (!settings) {
    return null;
  }

  return {
    projectKey: settings.projectKey,
    apiHost: ANALYTICS_RELAY_PATH,
    uiHost: settings.uiHost,
  };
}

/** `SIDEBAR_APPOINTMENTS_ONLY` is on unless `false`; `SIDEBAR_SHOW_VISITS` is off unless `true`. */
export function getSidebarMode(env: Env = process.env): SidebarMode {
  if (env.SIDEBAR_APPOINTMENTS_ONLY === 'false') {
    return 'full';
  }

  return env.SIDEBAR_SHOW_VISITS === 'true' ? 'appointments_and_visits' : 'appointments_only';
}
