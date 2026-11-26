'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { clearTabSession } from '@/app/lib/tab-session';
import { useSignOut } from '@/app/queries/auth/useSignOut';
import { AppSplashError } from '@/components/app/app-splash';
import { IdleWarningDialog } from '@/components/app/idle-warning-dialog';
import {
  getIdleState,
  recordActivity,
  IDLE_WARNING_MS,
  broadcastSignOut,
  readLastActivity,
  getSignedOutPath,
  getStartingActivity,
  LAST_ACTIVITY_KEY,
  readSignOutBroadcast,
  ACTIVITY_WRITE_INTERVAL_MS,
  type SignOutReason,
} from '@/app/lib/idle-session';

type Phase = 'active' | 'warning' | 'expired';

// Only direct user input counts. Background polling and programmatic scrolling never
// produce these, and `scroll` is left out because code can trigger it.
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;

type IdleSessionGuardProps = {
  children: ReactNode;
  timeoutMinutes: number;
};

export function IdleSessionGuard({ children, timeoutMinutes }: IdleSessionGuardProps) {
  const router = useRouter();
  const timeoutMs = timeoutMinutes * 60_000;

  const [phase, setPhase] = useState<Phase>('active');
  const [expiresAt, setExpiresAt] = useState(0);
  // Sticky: a retry briefly clears the mutation's error state, but the error screen must stay.
  const [signOutFailed, setSignOutFailed] = useState(false);
  const reasonRef = useRef<SignOutReason>('idle');
  const actionsRef = useRef<{ continueSession: () => void; signOutNow: () => void } | null>(null);

  const signOutMutation = useSignOut('idle_timeout', () => {
    broadcastSignOut(reasonRef.current);
    router.replace(getSignedOutPath(reasonRef.current));
    router.refresh();
  });
  const { mutate } = signOutMutation;
  // The Audit Log records Logout Now as the user's choice and a timeout as idle. The trigger
  // is passed per call because `expire` signs out in the same tick it picks the reason,
  // before a re-render could hand the hook a new one.
  const signOut = useCallback(
    () =>
      mutate(reasonRef.current === 'manual' ? 'user' : 'idle_timeout', {
        onError: () => setSignOutFailed(true),
      }),
    [mutate]
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let currentPhase: Phase = 'active';
    let lastActivity = getStartingActivity(Date.now());
    let lastWrite = lastActivity;

    function changePhase(next: Phase) {
      currentPhase = next;
      setPhase(next);
    }

    function expire(reason: SignOutReason) {
      clearTimeout(timer);
      reasonRef.current = reason;
      // Drop this tab's marker first: if the sign-out request fails, a reload must not
      // bring the app back. TabSessionGate will then retry ending the Session.
      clearTabSession();
      changePhase('expired');
      signOut();
    }

    // Recomputes the phase from the newest activity in any tab, using wall-clock time so
    // throttled background timers and laptop sleep cannot extend the Session.
    function evaluate() {
      if (currentPhase === 'expired') return;

      clearTimeout(timer);
      const now = Date.now();
      lastActivity = Math.max(lastActivity, readLastActivity() ?? 0);
      const state = getIdleState(lastActivity, now, timeoutMs);

      if (state.status === 'expired') {
        expire('idle');
      } else if (state.status === 'warning') {
        setExpiresAt(state.expiresAt);
        if (currentPhase !== 'warning') changePhase('warning');
        timer = setTimeout(evaluate, state.expiresAt - now);
      } else {
        if (currentPhase !== 'active') changePhase('active');
        timer = setTimeout(evaluate, state.warnAt - now);
      }
    }

    function markActive(now: number) {
      lastActivity = now;
      lastWrite = now;
      recordActivity(now);
    }

    function handleActivity(event: Event) {
      if (!event.isTrusted || currentPhase !== 'active') return;

      // Layout changes under a still cursor fire mousemove with no movement.
      if (event instanceof MouseEvent && event.type === 'mousemove') {
        if (event.movementX === 0 && event.movementY === 0) return;
      }

      const now = Date.now();

      // The timer may not have fired yet (sleeping laptop, throttled tab). Once the warning
      // is due, input must not silently extend the Session; only Continue Session can.
      if (now - lastActivity >= timeoutMs - IDLE_WARNING_MS) {
        evaluate();
        if (currentPhase !== 'active') return;
      }

      lastActivity = now;
      if (now - lastWrite >= ACTIVITY_WRITE_INTERVAL_MS) markActive(now);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === LAST_ACTIVITY_KEY) {
        // Continue Session in another tab closes this tab's warning too.
        if (currentPhase === 'warning') evaluate();
        return;
      }

      // Another tab already ended the shared Session; SignOutSync redirects this tab, so
      // only the idle clock stops here, keeping it from sending a second sign-out.
      if (readSignOutBroadcast(event.key, event.newValue)) {
        clearTimeout(timer);
        currentPhase = 'expired';
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') evaluate();
    }

    actionsRef.current = {
      continueSession: () => {
        markActive(Date.now());
        evaluate();
      },
      signOutNow: () => expire('manual'),
    };

    const listenerOptions = { capture: true, passive: true } as const;

    ACTIVITY_EVENTS.forEach((type) =>
      window.addEventListener(type, handleActivity, listenerOptions)
    );
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', evaluate);
    document.addEventListener('visibilitychange', handleVisibility);

    // Mounting is not activity, so the stored time is kept: a reload after a long idle spell
    // signs out at once, and one inside the warning period shows the warning straight away.
    evaluate();

    return () => {
      clearTimeout(timer);
      actionsRef.current = null;
      ACTIVITY_EVENTS.forEach((type) =>
        window.removeEventListener(type, handleActivity, listenerOptions)
      );
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', evaluate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [timeoutMs, signOut]);

  // Once the Session has expired the app is unmounted, not just covered: open forms, their
  // Sheet/Dialog portals and focus traps are all gone, so nothing behind the sign-out
  // screens can be clicked, typed into or focused. Only a successful sign-out leaves this
  // state, by redirecting to /login.
  if (signOutFailed) {
    return (
      <AppSplashError
        message="We couldn't end your Session on the server. Check your connection and try again."
        isRetrying={signOutMutation.isPending}
        onRetry={signOut}
      />
    );
  }

  if (phase === 'expired') {
    return <IdleWarningDialog expiresAt={0} isSigningOut onSignOut={noop} onContinue={noop} />;
  }

  return (
    <>
      {children}
      {phase === 'warning' ? (
        <IdleWarningDialog
          expiresAt={expiresAt}
          isSigningOut={false}
          onSignOut={() => actionsRef.current?.signOutNow()}
          onContinue={() => actionsRef.current?.continueSession()}
        />
      ) : null}
    </>
  );
}

function noop() {}
