import type {
  VisitStatus,
  VisitStatusCategory,
} from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListVisitStatusesResponse = Paginated<VisitStatus>;

export type SaveVisitStatusRequest = {
  name: string;
  code: string;
  category: VisitStatusCategory;
  color: string;
  description?: string;
};

export type SaveVisitStatusResponse = { data: VisitStatus };
