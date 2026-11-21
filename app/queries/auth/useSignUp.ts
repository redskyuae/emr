'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { SignupRequest, SignupResponse } from '@/app/api/v1/signup/types';
import { parseAuthApiError, type AuthApiError } from '@/app/queries/auth/auth-api-error';
import { SKIP_FAILURE_ANALYTICS } from '@/lib/analytics/request-failure';

async function signUp(request: SignupRequest): Promise<SignupResponse> {
  const response = await fetch('/api/v1/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseAuthApiError(response, 'Signup failed');
  }

  return response.json() as Promise<SignupResponse>;
}

type UseSignUpOptions = Omit<
  UseMutationOptions<SignupResponse, AuthApiError, SignupRequest>,
  'mutationFn'
>;

export function useSignUp(options?: UseSignUpOptions) {
  // A rejection is recorded by the form's own failure event, not as `action_rejected`.
  return useMutation({ mutationFn: signUp, meta: SKIP_FAILURE_ANALYTICS, ...options });
}
