'use client';

import { useCallback, useEffect, useEffectEvent, useRef } from 'react';

type FormFunnel = {
  /** False until the form is on screen (while it loads, or when access is denied). */
  active: boolean;
  onStarted: () => void;
  onAbandoned: (secondsSinceStarted: number) => void;
};

/**
 * The started and abandoned ends of a form's funnel. `onStarted` runs once when the form is first
 * shown; `onAbandoned` runs if the user leaves (navigates away or closes the tab) before
 * `finish()` is called on a successful save. React's development double mount is not a leave.
 */
export function useFormFunnelAnalytics({ active, onStarted, onAbandoned }: FormFunnel) {
  const startedAt = useRef<number | null>(null);
  const finished = useRef(false);
  const pendingLeave = useRef<ReturnType<typeof setTimeout> | null>(null);

  const secondsSinceStarted = useCallback(
    () => (startedAt.current === null ? 0 : Math.round((Date.now() - startedAt.current) / 1000)),
    []
  );
  const finish = useCallback(() => {
    finished.current = true;
  }, []);

  const start = useEffectEvent(() => onStarted());
  const leave = useEffectEvent(() => {
    if (startedAt.current === null || finished.current) {
      return;
    }

    finished.current = true;
    onAbandoned(secondsSinceStarted());
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    if (pendingLeave.current) {
      clearTimeout(pendingLeave.current);
      pendingLeave.current = null;
    }

    if (startedAt.current === null) {
      startedAt.current = Date.now();
      start();
    }

    const handlePageHide = () => leave();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      // Deferred so an immediate remount (React Strict Mode) can cancel it.
      pendingLeave.current = setTimeout(() => {
        pendingLeave.current = null;
        leave();
      }, 0);
    };
  }, [active]);

  return { secondsSinceStarted, finish };
}
