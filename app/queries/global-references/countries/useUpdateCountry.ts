'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateCountryRequest,
  UpdateCountryResponse,
} from '@/app/api/v1/countries/[id]/types';
import { countryQueryKey } from './useCountry';
import { COUNTRIES_KEY } from './useCountries';

export type UpdateCountryVariables = {
  id: number;
  request: UpdateCountryRequest;
};

async function updateCountry({
  id,
  request,
}: UpdateCountryVariables): Promise<UpdateCountryResponse> {
  const response = await fetch(`/api/v1/countries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Country');
  }

  return response.json() as Promise<UpdateCountryResponse>;
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCountry,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY });
      void queryClient.invalidateQueries({ queryKey: countryQueryKey(variables.id) });
    },
  });
}
