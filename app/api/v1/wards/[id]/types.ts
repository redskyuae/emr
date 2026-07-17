import type { Ward } from '@/app/api/lib/modules/ward/schemas/ward-schema';

export type GetWardResponse = {
  data: Ward;
};

export type UpdateWardRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateWardResponse = {
  data: Ward;
};

export type DeleteWardResponse = void;
