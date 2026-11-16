import type {
  VisitDiagnosis,
  VisitDiagnosisCodeSystem,
  VisitDiagnosisType,
} from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';

export type ListVisitDiagnosesResponse = {
  data: VisitDiagnosis[];
};

// A full replace of the Visit's diagnoses; an empty list clears them. Each code
// system with entries needs exactly one PRINCIPAL. Order sets sortOrder.
export type SaveVisitDiagnosesRequest = {
  diagnoses: {
    codeSystem: VisitDiagnosisCodeSystem;
    diagnosisCodeId?: number;
    ayurvedaDiagnosisCodeId?: number;
    diagnosisType: VisitDiagnosisType;
    notes?: string | null;
  }[];
};

export type SaveVisitDiagnosesResponse = {
  data: VisitDiagnosis[];
};
