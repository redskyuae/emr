import type { Religion } from '@/app/api/lib/modules/religion/schemas/religion-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListReligionsResponse = Paginated<Religion>;

export type SaveReligionRequest = {
  name: string;
  code: string;
};

export type SaveReligionResponse = {
  data: Religion;
};
