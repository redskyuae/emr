import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type GetVisitResponse = { data: Visit };

export type UpdateVisitRequest = {
  doctorId?: number;
  appointmentTypeId: number;
  appointmentReasonId?: number;
  chiefComplaint?: string;
  notes?: string;
};

export type UpdateVisitResponse = { data: Visit };
export type DeleteVisitResponse = void;
