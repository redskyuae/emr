import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type CancelVisitRequest = {
  cancellationReason: string;
};

export type CancelVisitResponse = {
  data: Visit;
};
