import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';

export type GetAyurvedaDiagnosisCodeResponse = {
  data: AyurvedaDiagnosisCode;
};

export type UpdateAyurvedaDiagnosisCodeRequest = {
  code: string;
  title: string;
  category?: string;
};

export type UpdateAyurvedaDiagnosisCodeResponse = {
  data: AyurvedaDiagnosisCode;
};

export type DeleteAyurvedaDiagnosisCodeResponse = void;
