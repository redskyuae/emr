'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { DEFAULT_AUTH_REDIRECT_PATH } from '@/app/lib/auth-route-guards';
import { hasTabSession } from '@/app/lib/tab-session';
import { useSignOut } from '@/app/queries/auth/useSignOut';
import { AppSplashError, AppSplashLoading } from '@/components/app/app-splash';

export function ExistingSessionGate() {
  const router = useRouter();
  const signOutMutation = useSignOut(() => router.refresh());
  const checkedRef = useRef(false);
  const { mutate: signOutStaleSession } = signOutMutation;

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    if (hasTabSession()) {
      router.replace(DEFAULT_AUTH_REDIRECT_PATH);
    } else {
      signOutStaleSession();
    }
  }, [router, signOutStaleSession]);

  if (signOutMutation.isError) {
    return (
      <AppSplashError
        message="We couldn't end the previous Session. Check your connection and try again."
        isRetrying={signOutMutation.isPending}
        onRetry={signOutStaleSession}
      />
    );
  }

  return <AppSplashLoading fading={false} />;
}
