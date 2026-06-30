import type { Specialty } from '@/app/api/lib/modules/specialty/schemas/specialty-schema';

export type GetSpecialtyResponse = {
  data: Specialty;
};

export type UpdateSpecialtyRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
};

export type UpdateSpecialtyResponse = {
  data: Specialty;
};

export type DeleteSpecialtyResponse = void;
