'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  isSessionExpiredError,
  useCurrentUserQuery,
} from '@/app/queries/identity-access/useCurrentUser';
import { AppSplashError, AppSplashLoading } from '@/components/app/app-splash';

type Phase = 'loading' | 'fading' | 'ready';

const FADE_MS = 200;
const MIN_DISPLAY_MS = 800;
const LOAD_ERROR_MESSAGE = "We couldn't load your workspace. Check your connection and try again.";

export function AppShellGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isError, error, isFetching, refetch } = useCurrentUserQuery();

  const [phase, setPhase] = useState<Phase>('loading');
  const startRef = useRef<number | null>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (isError && isSessionExpiredError(error) && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace('/login');
    }
  }, [isError, error, router]);

  useEffect(() => {
    if (phase !== 'loading' || data === undefined) {
      return;
    }

    const elapsed = Date.now() - (startRef.current ?? Date.now());
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
    const timer = setTimeout(() => setPhase('fading'), remaining);

    return () => clearTimeout(timer);
  }, [phase, data]);

  useEffect(() => {
    if (phase !== 'fading') {
      return;
    }

    const timer = setTimeout(() => setPhase('ready'), FADE_MS);

    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'loading' && isError && !isSessionExpiredError(error)) {
    return (
      <AppSplashError
        message={LOAD_ERROR_MESSAGE}
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <>
      {phase !== 'loading' ? children : null}
      {phase !== 'ready' ? <AppSplashLoading fading={phase === 'fading'} /> : null}
    </>
  );
}
