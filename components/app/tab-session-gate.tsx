'use client';

import { ReactNode, useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { hasTabSession } from '@/app/lib/tab-session';
import { useSignOut } from '@/app/queries/auth/useSignOut';
import { AppSplashError, AppSplashLoading } from '@/components/app/app-splash';

function subscribeToTabSession() {
  return () => {};
}

export function TabSessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signOutMutation = useSignOut(() => {
    router.replace('/login');
    router.refresh();
  });
  const hasAccess = useSyncExternalStore(subscribeToTabSession, hasTabSession, () => false);
  const checkedRef = useRef(false);
  const { mutate: signOutStaleSession } = signOutMutation;

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    if (!hasTabSession()) {
      signOutStaleSession();
    }
  }, [signOutStaleSession]);

  if (hasAccess) return children;

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
