// Same-origin ingestion. The browser sends events to `/relay/...` on the app's own origin and the
// relay route forwards them to PostHog. A plain Next rewrite would forward the browser's request
// headers, including the BetterAuth session cookie and a Referer that holds the full page address,
// so the relay builds the upstream request itself from an allow-list instead.

import type { AnalyticsSettings } from '@/lib/analytics/analytics-settings';

/** Request headers PostHog needs to read the payload. Nothing else is forwarded. */
const FORWARDED_REQUEST_HEADERS = ['content-type', 'content-encoding', 'accept'];

/** Response headers passed back to the browser. Never `set-cookie`. */
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'cache-control'];

const ASSET_PREFIXES = new Set(['static', 'array']);

/**
 * PostHog's asset paths (`static/*`, `array/*`) go to the asset host; everything else to the
 * ingestion host. Next drops the trailing slash PostHog's ingestion paths end with (`/e/`,
 * `/flags/`) before the relay sees them, so it is restored for those.
 */
export function buildRelayTarget(
  settings: Pick<AnalyticsSettings, 'host' | 'assetsHost'>,
  segments: readonly string[],
  search: string
): string {
  const isAsset = ASSET_PREFIXES.has(segments[0] ?? '');
  const host = isAsset ? settings.assetsHost : settings.host;
  const path = segments.map((segment) => encodeURIComponent(segment)).join('/');
  const trailingSlash = isAsset || path === '' ? '' : '/';

  return `${host}/${path}${trailingSlash}${search}`;
}

function pickHeaders(source: Headers, names: readonly string[]) {
  const headers = new Headers();

  for (const name of names) {
    const value = source.get(name);

    if (value !== null) {
      headers.set(name, value);
    }
  }

  return headers;
}

export function buildRelayRequestHeaders(incoming: Headers): Headers {
  return pickHeaders(incoming, FORWARDED_REQUEST_HEADERS);
}

export function buildRelayResponseHeaders(upstream: Headers): Headers {
  return pickHeaders(upstream, FORWARDED_RESPONSE_HEADERS);
}
