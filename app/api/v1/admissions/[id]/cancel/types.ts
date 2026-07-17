import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';

export type CancelAdmissionRequest = {
  cancellationReason: string;
};

export type CancelAdmissionResponse = {
  data: Admission;
};
