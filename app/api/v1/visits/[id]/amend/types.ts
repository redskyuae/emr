import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type AmendVisitRequest = {
  doctorId: number;
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
