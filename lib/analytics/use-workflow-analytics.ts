'use client';

// The start and abandon of one workflow screen (Book Appointment, Reschedule, Check-in), shared so
// each screen counts them the same way. The screen records the events; this hook decides when.

import { useEffect, useEffectEvent, useRef } from 'react';

import type { AnalyticsCaptureOptions } from '@/lib/analytics/analytics-client';

type Abandon = {
  secondsSinceStarted: number;
  /** Set when the page is hiding, so the event goes out by beacon. */
  options?: AnalyticsCaptureOptions;
};

type WorkflowAnalyticsOptions = {
  /** The workflow starts the first time this is true, for a screen that loads before it is usable. */
  ready?: boolean;
  onStart: () => void;
  /** Called at most once, when the screen unmounts or the page hides before `markSucceeded`. */
  onAbandon: (abandon: Abandon) => void;
};

function elapsedSeconds(startedAt: number) {
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

export function useWorkflowAnalytics({
  ready = true,
  onStart,
  onAbandon,
}: WorkflowAnalyticsOptions) {
  const startedAt = useRef<number | null>(null);
  const ended = useRef(false);
  const pendingUnmount = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useEffectEvent(() => {
    if (startedAt.current !== null) return;

    startedAt.current = Date.now();
    onStart();
  });

  const abandon = useEffectEvent((options?: AnalyticsCaptureOptions) => {
    if (startedAt.current === null || ended.current) return;

    ended.current = true;
    onAbandon({ secondsSinceStarted: elapsedSeconds(startedAt.current), options });
  });

  useEffect(() => {
    if (ready) start();
  }, [ready]);

  useEffect(() => {
    // React strict mode unmounts and remounts once in development. The unmount below waits a
    // tick before counting as an abandon, and a remount of the same screen cancels it.
    if (pendingUnmount.current !== null) {
      clearTimeout(pendingUnmount.current);
      pendingUnmount.current = null;
    }

    const handlePageHide = () => abandon({ transport: 'sendBeacon' });
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      pendingUnmount.current = setTimeout(() => {
        pendingUnmount.current = null;
        abandon();
      }, 0);
    };
  }, []);

  return {
    /** Whole seconds since this screen's start event; 0 before it started. */
    secondsSinceStarted: () => (startedAt.current === null ? 0 : elapsedSeconds(startedAt.current)),
    /** The workflow's outcome succeeded: leaving the screen from now on is not an abandon. */
    markSucceeded: () => {
      ended.current = true;
    },
  };
}
