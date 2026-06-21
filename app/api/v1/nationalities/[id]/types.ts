import type { Nationality } from '@/app/api/lib/modules/nationality/schemas/nationality-schema';

export type GetNationalityResponse = {
  data: Nationality;
};

export type UpdateNationalityRequest = {
  name: string;
  code: string;
};

export type UpdateNationalityResponse = {
  data: Nationality;
};

export type DeleteNationalityResponse = void;
