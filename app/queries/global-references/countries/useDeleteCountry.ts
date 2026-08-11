'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { countryQueryKey } from './useCountry';
import { COUNTRIES_KEY } from './useCountries';

async function deleteCountry(id: number): Promise<void> {
  const response = await fetch(`/api/v1/countries/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Country');
  }
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCountry,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY });
      void queryClient.invalidateQueries({ queryKey: countryQueryKey(id) });
    },
  });
}
