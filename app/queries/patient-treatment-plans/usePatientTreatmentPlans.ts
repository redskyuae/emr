import { useQuery } from '@tanstack/react-query';

import type { PatientRegistrationStatus } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { ListPatientTreatmentPlansResponse } from '@/app/api/v1/patients/[id]/treatment-plans/types';
import { parseApiError } from '@/app/queries/api-error';

type PatientTreatmentPlansQueryParams = {
  patientId: number | null;
  registrationStatus: PatientRegistrationStatus | null;
  bookingPath: 'CONSULTATION' | 'PROCEDURE' | '';
};

export const patientTreatmentPlansQueryKey = (patientId: number | null) =>
  ['patients', patientId, 'treatment-plans', { status: 'current' }] as const;

export const patientTreatmentPlansBaseKey = (patientId: number | null) =>
  ['patients', patientId, 'treatment-plans'] as const;

export const patientTreatmentPlanHistoryQueryKey = (patientId: number) =>
  [...patientTreatmentPlansBaseKey(patientId), { status: 'all' }] as const;

async function fetchPatientTreatmentPlans(
  patientId: number,
  status: 'current' | 'all' = 'current'
): Promise<ListPatientTreatmentPlansResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/treatment-plans?status=${status}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Patient Treatment Plans');
  }

  return response.json() as Promise<ListPatientTreatmentPlansResponse>;
}

function transformPatientTreatmentPlansResponse(response: ListPatientTreatmentPlansResponse) {
  return response.data;
}

export function usePatientTreatmentPlansQuery({
  patientId,
  registrationStatus,
  bookingPath,
}: PatientTreatmentPlansQueryParams) {
  return useQuery({
    queryKey: patientTreatmentPlansQueryKey(patientId),
    queryFn: () => fetchPatientTreatmentPlans(patientId as number),
    enabled:
      patientId !== null && registrationStatus === 'registered' && bookingPath === 'PROCEDURE',
    select: transformPatientTreatmentPlansResponse,
  });
}

export function useCurrentPatientTreatmentPlansQuery(patientId: number) {
  return useQuery({
    queryKey: patientTreatmentPlansQueryKey(patientId),
    queryFn: () => fetchPatientTreatmentPlans(patientId),
    select: transformPatientTreatmentPlansResponse,
  });
}

export function usePatientTreatmentPlanHistoryQuery(patientId: number) {
  return useQuery({
    queryKey: patientTreatmentPlanHistoryQueryKey(patientId),
    queryFn: () => fetchPatientTreatmentPlans(patientId, 'all'),
    select: transformPatientTreatmentPlansResponse,
  });
}
