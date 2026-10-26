'use client';

import { useQuery } from '@tanstack/react-query';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { ListVisitsResponse } from '@/app/api/v1/visits/types';
import { parseApiError } from '@/app/queries/api-error';

const PAGE_SIZE = 100;
const DOCTOR_VISIT_CODES = new Set(['OPD', 'FUP', 'EMER']);

function visitDateToIso(value: string) {
  const [day, month, year] = value.split('-');
  return `${year}-${month}-${day}`;
}

function sevenDaysBefore(referenceDate: string) {
  const date = new Date(`${referenceDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString().slice(0, 10);
}

function isDoctorVisit(visit: Visit) {
  return (
    visit.treatmentSession === null && DOCTOR_VISIT_CODES.has(visit.visitType.code.toUpperCase())
  );
}

export async function fetchRecentDoctorVisit(patientId: number, referenceDate: string) {
  const cutoffDate = sevenDaysBefore(referenceDate);
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      patientId: String(patientId),
      status: 'COMPLETED',
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    const response = await fetch(`/api/v1/visits?${params}`, { credentials: 'same-origin' });

    if (!response.ok) {
      throw await parseApiError(response, 'Could not check recent Doctor Visits');
    }

    const result = (await response.json()) as ListVisitsResponse;

    for (const visit of result.data) {
      const visitDate = visitDateToIso(visit.visitDate);
      if (visitDate < cutoffDate) return null;
      if (visitDate <= referenceDate && isDoctorVisit(visit)) {
        return { visitDate: visit.visitDate, visitNumber: visit.visitNumber };
      }
    }

    if (page >= result.meta.totalPages || result.data.length === 0) return null;
    page += 1;
  }
}

export function useRecentDoctorVisitQuery(patientId: number | null, referenceDate: string | null) {
  return useQuery({
    queryKey: ['recent-doctor-visit', patientId, referenceDate],
    queryFn: () => fetchRecentDoctorVisit(patientId!, referenceDate!),
    enabled: patientId !== null && referenceDate !== null,
  });
}
