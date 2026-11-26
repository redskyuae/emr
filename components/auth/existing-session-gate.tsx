'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { hasTabSession } from '@/app/lib/tab-session';
import { useSignOut } from '@/app/queries/auth/useSignOut';
import { fetchCurrentUserHomePath } from '@/app/queries/identity-access/useCurrentUser';
import { AppSplashError, AppSplashLoading } from '@/components/app/app-splash';

export function ExistingSessionGate() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOutMutation = useSignOut('stale_tab', () => router.refresh());
  const checkedRef = useRef(false);
  const { mutate: signOutStaleSession } = signOutMutation;

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    if (hasTabSession()) {
      void fetchCurrentUserHomePath(queryClient).then((homePath) => router.replace(homePath));
    } else {
      signOutStaleSession();
    }
  }, [queryClient, router, signOutStaleSession]);

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
