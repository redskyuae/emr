import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListVisitsResponse = Paginated<Visit>;

export type CreateVisitRequest = {
  patientId: number;
  doctorId?: number;
  appointmentTypeId: number;
  appointmentReasonId?: number;
  chiefComplaint?: string;
  notes?: string;
};

export type CreateVisitResponse = { data: Visit };
