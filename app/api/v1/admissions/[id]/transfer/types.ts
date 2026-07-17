import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';

export type TransferBedRequest = {
  toBedId: number;
  reason?: string | null;
};

export type TransferBedResponse = {
  data: Admission;
};
