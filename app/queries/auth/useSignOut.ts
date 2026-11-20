'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SignoutResponse } from '@/app/api/v1/signout/types';
import { clearTabSession } from '@/app/lib/tab-session';
import { clearLastActivity } from '@/app/lib/idle-session';

async function signOut(): Promise<SignoutResponse> {
  const response = await fetch('/api/v1/signout', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('Sign out failed');
  }
}

export function useSignOut(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      clearTabSession();
      // The next sign-in records a fresh time; an old one must never carry over.
      clearLastActivity();
      queryClient.clear();
      onSuccess?.();
    },
  });
}
