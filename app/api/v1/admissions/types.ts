import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAdmissionsResponse = Paginated<Admission>;

export type AdmitPatientRequest = {
  patientId: number;
  doctorId: number;
  admissionTypeId: number;
  bedId: number;
  visitId?: number;
  remarks?: string | null;
  admissionReason?: string | null;
  expectedDischargeDate?: string | null;
};

export type AdmitPatientResponse = {
  data: Admission;
};
