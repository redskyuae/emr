import type {
  Admission,
  DischargeDisposition,
} from '@/app/api/lib/modules/admission/schemas/admission-schema';

export type DischargeAdmissionRequest = {
  dischargeDisposition: DischargeDisposition;
  dischargeSummary?: string | null;
};

export type DischargeAdmissionResponse = {
  data: Admission;
};
