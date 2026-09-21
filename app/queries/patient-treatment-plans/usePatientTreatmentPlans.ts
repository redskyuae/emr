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

async function fetchPatientTreatmentPlans(
  patientId: number
): Promise<ListPatientTreatmentPlansResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/treatment-plans?status=current`, {
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
