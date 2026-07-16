import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';

export type GetVisitTypeResponse = {
  data: VisitType;
};

export type UpdateVisitTypeRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateVisitTypeResponse = {
  data: VisitType;
};

export type DeleteVisitTypeResponse = void;
