import type { AdmitSource } from '@/app/api/lib/modules/admit-source/schemas/admit-source-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAdmitSourcesResponse = Paginated<AdmitSource>;

export type SaveAdmitSourceRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type SaveAdmitSourceResponse = {
  data: AdmitSource;
};
