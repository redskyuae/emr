'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { SigninRequest, SigninResponse } from '@/app/api/v1/signin/types';
import { parseAuthApiError, type AuthApiError } from '@/app/queries/auth/auth-api-error';

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
  return useMutation({ mutationFn: signIn, ...options });
}
