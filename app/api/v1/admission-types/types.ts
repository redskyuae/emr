import type { AdmissionType } from '@/app/api/lib/modules/admission-type/schemas/admission-type-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAdmissionTypesResponse = Paginated<AdmissionType>;

export type SaveAdmissionTypeRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type SaveAdmissionTypeResponse = {
  data: AdmissionType;
};
