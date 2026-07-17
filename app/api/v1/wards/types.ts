import type { Ward } from '@/app/api/lib/modules/ward/schemas/ward-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListWardsResponse = Paginated<Ward>;

export type SaveWardRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type SaveWardResponse = {
  data: Ward;
};
