import type { Nationality } from '@/app/api/lib/modules/nationality/schemas/nationality-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListNationalitiesResponse = Paginated<Nationality>;

export type SaveNationalityRequest = {
  name: string;
  code: string;
};

export type SaveNationalityResponse = {
  data: Nationality;
};
