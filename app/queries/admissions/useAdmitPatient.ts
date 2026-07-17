'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { AdmitPatientRequest, AdmitPatientResponse } from '@/app/api/v1/admissions/types';
import { BEDS_KEY } from '@/app/queries/inpatient-masters/beds/useBeds';
import { ADMISSIONS_KEY } from './useAdmissions';

async function admitPatient(request: AdmitPatientRequest): Promise<AdmitPatientResponse> {
  const response = await fetch('/api/v1/admissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not admit the Patient');
  }

  return response.json() as Promise<AdmitPatientResponse>;
}

type UseAdmitPatientOptions = Omit<
  UseMutationOptions<AdmitPatientResponse, Error, AdmitPatientRequest>,
  'mutationFn'
>;

export function useAdmitPatient(options?: UseAdmitPatientOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: admitPatient,
    onSuccess: async (...args) => {
      // Admitting occupies a Bed, so the Bed caches (lists and the Bed Board)
      // refresh together with the census.
      await queryClient.invalidateQueries({ queryKey: ADMISSIONS_KEY });
      await queryClient.invalidateQueries({ queryKey: BEDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
