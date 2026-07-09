import type {
  VisitStatus,
  VisitStatusCategory,
} from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';

export type GetVisitStatusResponse = { data: VisitStatus };

export type UpdateVisitStatusRequest = {
  name: string;
  code: string;
  category: VisitStatusCategory;
  color: string;
  description?: string;
};

export type UpdateVisitStatusResponse = { data: VisitStatus };
export type DeleteVisitStatusResponse = void;
