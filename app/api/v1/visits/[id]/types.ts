import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type GetVisitResponse = {
  data: Visit;
};

export type UpdateVisitRequest = {
  chiefComplaint?: string | null;
  remarks?: string | null;
};

export type UpdateVisitResponse = {
  data: Visit;
};

export type DeleteVisitResponse = void;
