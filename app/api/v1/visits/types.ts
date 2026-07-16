import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListVisitsResponse = Paginated<Visit>;

/**
 * Check-in accepts exactly one of two shapes: `appointmentId` to fulfil an
 * Appointment, or `patientId` + `doctorId` for a Walk-in Visit.
 */
export type CheckInVisitRequest = {
  visitTypeId: number;
  appointmentId?: number;
  patientId?: number;
  doctorId?: number;
  chiefComplaint?: string | null;
  remarks?: string | null;
};

export type CheckInVisitResponse = {
  data: Visit;
};
