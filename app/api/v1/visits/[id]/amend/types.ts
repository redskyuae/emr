import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type AmendVisitRequest = {
  /** Required for an OPD Consultation; null or omitted leaves the Visit without a Doctor. */
  doctorId?: number | null;
  visitTypeId: number;
  remarks?: string | null;
  treatmentId?: number | null;
  admitSourceId?: number | null;
  chiefComplaint?: string | null;
  treatmentSessionId?: number | null;
};

export type AmendVisitResponse = {
  data: Visit;
};
