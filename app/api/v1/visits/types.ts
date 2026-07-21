import type { VisitDocumentMetadata } from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListVisitsResponse = Paginated<Visit>;

/**
 * Check-in accepts exactly one of two shapes: `appointmentId` to fulfil an
 * Appointment, or `patientId` + `doctorId` for a Walk-in Visit. Documents already
 * uploaded to Blob may ride along and are attached to the created Visit.
 */
export type CheckInVisitRequest = {
  visitTypeId: number;
  appointmentId?: number;
  patientId?: number;
  doctorId?: number;
  chiefComplaint?: string | null;
  remarks?: string | null;
  documents?: VisitDocumentMetadata[];
};

export type CheckInVisitResponse = {
  data: Visit;
};
