import type { AdmitSource } from '@/app/api/lib/modules/admit-source/schemas/admit-source-schema';

export type GetAdmitSourceResponse = {
  data: AdmitSource;
};

export type UpdateAdmitSourceRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateAdmitSourceResponse = {
  data: AdmitSource;
};

export type DeleteAdmitSourceResponse = void;
