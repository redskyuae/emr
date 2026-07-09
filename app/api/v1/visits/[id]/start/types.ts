import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type StartVisitRequest = { statusId?: number };
export type StartVisitResponse = { data: Visit };
