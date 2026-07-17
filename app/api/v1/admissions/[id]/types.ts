import type {
  Admission,
  AdmissionDetail,
} from '@/app/api/lib/modules/admission/schemas/admission-schema';

export type GetAdmissionResponse = {
  data: AdmissionDetail;
};

export type UpdateAdmissionRequest = {
  remarks?: string | null;
  admissionReason?: string | null;
  expectedDischargeDate?: string | null;
};

export type UpdateAdmissionResponse = {
  data: Admission;
};

export type DeleteAdmissionResponse = void;
