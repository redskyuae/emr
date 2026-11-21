'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { SigninRequest, SigninResponse } from '@/app/api/v1/signin/types';
import { parseAuthApiError, type AuthApiError } from '@/app/queries/auth/auth-api-error';
import { SKIP_FAILURE_ANALYTICS } from '@/lib/analytics/request-failure';

async function signIn(request: SigninRequest): Promise<SigninResponse> {
  const response = await fetch('/api/v1/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseAuthApiError(response, 'Sign-in failed');
  }

  return response.json() as Promise<SigninResponse>;
}

type UseSignInOptions = Omit<
  UseMutationOptions<SigninResponse, AuthApiError, SigninRequest>,
  'mutationFn'
>;

export function useSignIn(options?: UseSignInOptions) {
  // A rejection is recorded by the form's own failure event, not as `action_rejected`.
  return useMutation({ mutationFn: signIn, meta: SKIP_FAILURE_ANALYTICS, ...options });
}
