'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveCountryRequest, SaveCountryResponse } from '@/app/api/v1/countries/types';
import { COUNTRIES_KEY } from './useCountries';

async function createCountry(request: SaveCountryRequest): Promise<SaveCountryResponse> {
  const response = await fetch('/api/v1/countries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Country');
  }

  return response.json() as Promise<SaveCountryResponse>;
}

export function useCreateCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCountry,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY });
    },
  });
}
