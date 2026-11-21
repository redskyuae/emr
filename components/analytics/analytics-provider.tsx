'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { hasTabSession } from '@/app/lib/tab-session';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { captureAnalyticsEvent, startAnalytics } from '@/lib/analytics/analytics-client';
import type { ClientAnalyticsSettings } from '@/lib/analytics/analytics-settings';
import type { SidebarMode } from '@/lib/analytics/catalogue';
import { isDemoRoute } from '@/lib/analytics/page-context';

function AnalyticsPageviews() {
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    // A query-string change (a sheet, a filter) keeps the pathname, so it is not a page view.
    if (!pathname || lastPathname.current === pathname) {
      return;
    }

    lastPathname.current = pathname;
    captureAnalyticsEvent('$pageview', { is_demo_page: isDemoRoute(pathname) });
  }, [pathname]);

  return null;
}

/**
 * Starts PostHog when the deployment switch is on (`settings` is `null` when it is off) and
 * records page views. Settings are read on the server and passed in, like the brand variant.
 */
export function AnalyticsProvider({
  settings,
  sidebarMode,
  children,
}: {
  settings: ClientAnalyticsSettings | null;
  sidebarMode: SidebarMode;
  children: ReactNode;
}) {
  const brandVariant = useBrandLogoVariant();

  // Started during the first client render, before any child effect runs, so the first page view
  // and an early identify are queued rather than lost. `startAnalytics` runs once per page load.
  useState(() => {
    if (settings && typeof window !== 'undefined') {
      startAnalytics({ settings, brandVariant, sidebarMode, signedIn: hasTabSession() });
    }

    return null;
  });

  return (
    <>
      {settings ? <AnalyticsPageviews /> : null}
      {children}
    </>
  );
}
