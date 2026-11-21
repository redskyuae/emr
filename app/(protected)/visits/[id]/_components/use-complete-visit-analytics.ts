'use client';

import { useEffect, useEffectEvent, useRef } from 'react';

import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';

import type { visitOutstandingKinds } from '../_utils/visit-workflow';

/**
 * Records the complete-Visit dialog opening, with the fixed kinds of what it warns about, and
 * closing without completing. Completing is recorded by the server (`visit_completed`).
 */
export function useCompleteVisitAnalytics({
  open,
  outstandingKinds,
  visitStatus,
}: {
  open: boolean;
  outstandingKinds: ReturnType<typeof visitOutstandingKinds>;
  visitStatus: VisitStatus;
}) {
  const wasOpen = useRef(false);
  const countWhenOpened = useRef(0);

  const recordOpenChange = useEffectEvent((isOpen: boolean) => {
    if (isOpen === wasOpen.current) return;

    wasOpen.current = isOpen;

    if (isOpen) {
      countWhenOpened.current = outstandingKinds.length;
      captureAnalyticsEvent('consultation_complete_opened', {
        outstanding_kinds: outstandingKinds,
        outstanding_item_count: outstandingKinds.length,
      });
    } else if (visitStatus !== 'COMPLETED') {
      // Completing closes the dialog only after the Visit has reloaded as Completed.
      captureAnalyticsEvent('consultation_complete_dismissed', {
        outstanding_item_count: countWhenOpened.current,
      });
    }
  });

  useEffect(() => {
    recordOpenChange(open);
  }, [open]);
}
