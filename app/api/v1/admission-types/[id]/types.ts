import type { AdmissionType } from '@/app/api/lib/modules/admission-type/schemas/admission-type-schema';

export type GetAdmissionTypeResponse = {
  data: AdmissionType;
};

export type UpdateAdmissionTypeRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateAdmissionTypeResponse = {
  data: AdmissionType;
};

export type DeleteAdmissionTypeResponse = void;
