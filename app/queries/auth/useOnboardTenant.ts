'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { OnboardTenantResponse } from '@/app/api/v1/onboarding/types';
import { parseAuthApiError, type AuthApiError } from '@/app/queries/auth/auth-api-error';

async function onboardTenant(): Promise<OnboardTenantResponse> {
  const response = await fetch('/api/v1/onboarding', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseAuthApiError(response, 'Tenant onboarding failed');
  }

  return response.json() as Promise<OnboardTenantResponse>;
}

type UseOnboardTenantOptions = Omit<
  UseMutationOptions<OnboardTenantResponse, AuthApiError, void>,
  'mutationFn'
>;

export function useOnboardTenant(options?: UseOnboardTenantOptions) {
  return useMutation({ mutationFn: onboardTenant, ...options });
}
