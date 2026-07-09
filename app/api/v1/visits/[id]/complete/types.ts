import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type CompleteVisitRequest = { statusId?: number };
export type CompleteVisitResponse = { data: Visit };
