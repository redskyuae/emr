import { type NextRequest, NextResponse } from 'next/server';

import { getAnalyticsSettings } from '@/lib/analytics/analytics-settings';
import {
  buildRelayRequestHeaders,
  buildRelayResponseHeaders,
  buildRelayTarget,
} from '@/lib/analytics/relay';

// Forwards browser analytics to PostHog without the session cookie (see lib/analytics/relay.ts).
// `proxy.ts` does not run on this path, so anonymous events from /login and /signup arrive too.

type RelayContext = {
  params: Promise<{ path: string[] }>;
};

const UPSTREAM_TIMEOUT_MS = 10_000;

async function relay(request: NextRequest, context: RelayContext) {
  const settings = getAnalyticsSettings();

  if (!settings) {
    return new NextResponse(null, { status: 404 });
  }

  const { path } = await context.params;
  const target = buildRelayTarget(settings, path, request.nextUrl.search);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: buildRelayRequestHeaders(request.headers),
      body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: buildRelayResponseHeaders(upstream.headers),
    });
  } catch {
    // PostHog being unreachable is not the browser's problem: the SDK drops or retries quietly.
    return new NextResponse(null, { status: 502 });
  }
}

export function GET(request: NextRequest, context: RelayContext) {
  return relay(request, context);
}

export function POST(request: NextRequest, context: RelayContext) {
  return relay(request, context);
}
