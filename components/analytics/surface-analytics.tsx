'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { cleanPath } from '@/lib/analytics/clean-address';
import { openedSurfaces } from '@/lib/analytics/surfaces';

/**
 * Records `surface_opened` for every sheet and dialog whose open state is in the URL (ADR 0010),
 * from one place instead of every page container. `lib/analytics/surfaces.ts` maps each page's
 * parameters to a surface name and mode; the record id in the value is never read past that.
 */
export function SurfaceAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previous = useRef<{ pathname: string; params: URLSearchParams } | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const before = previous.current?.pathname === pathname ? previous.current.params : null;

    for (const opened of openedSurfaces(cleanPath(pathname), before, searchParams)) {
      captureAnalyticsEvent('surface_opened', opened);
    }

    previous.current = { pathname, params: new URLSearchParams(searchParams.toString()) };
  }, [pathname, searchParams]);

  return null;
}
