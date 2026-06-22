import type { Religion } from '@/app/api/lib/modules/religion/schemas/religion-schema';

export type GetReligionResponse = {
  data: Religion;
};

export type UpdateReligionRequest = {
  name: string;
  code: string;
};

export type UpdateReligionResponse = {
  data: Religion;
};

export type DeleteReligionResponse = void;
