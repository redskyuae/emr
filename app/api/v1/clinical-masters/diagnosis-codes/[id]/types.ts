import type { DiagnosisCode } from '@/app/api/lib/modules/diagnosis-code/schemas/diagnosis-code-schema';

export type GetDiagnosisCodeResponse = {
  data: DiagnosisCode;
};

export type UpdateDiagnosisCodeRequest = {
  code: string;
  title: string;
  category?: string;
};

export type UpdateDiagnosisCodeResponse = {
  data: DiagnosisCode;
};

export type DeleteDiagnosisCodeResponse = void;
