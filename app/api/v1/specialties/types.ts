import type { Specialty } from '@/app/api/lib/modules/specialty/schemas/specialty-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListSpecialtiesResponse = Paginated<Specialty>;

export type SaveSpecialtyRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
};

export type SaveSpecialtyResponse = {
  data: Specialty;
};
