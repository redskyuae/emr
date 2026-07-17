import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListVisitTypesResponse = Paginated<VisitType>;

export type SaveVisitTypeRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type SaveVisitTypeResponse = {
  data: VisitType;
};
