'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SignoutResponse } from '@/app/api/v1/signout/types';
import { clearTabSession } from '@/app/lib/tab-session';
import { clearLastActivity } from '@/app/lib/idle-session';

async function signOut(trigger: SignOutTrigger): Promise<SignoutResponse> {
  // The trigger tells the Audit Log why the Session ended.
  const response = await fetch(`/api/v1/signout?trigger=${encodeURIComponent(trigger)}`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('Sign out failed');
  }
}

/** `trigger` says why the Session ends; it is recorded as `signed_out` before identity is cleared. */
export function useSignOut(trigger: SignOutTrigger, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(trigger),
    onSuccess: () => {
      resetAnalyticsUser(trigger);
      clearTabSession();
      // The next sign-in records a fresh time; an old one must never carry over.
      clearLastActivity();
      queryClient.clear();
      onSuccess?.();
    },
  });
}
