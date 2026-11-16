import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';

export type GetAyurvedaDiagnosisCodeResponse = {
  data: AyurvedaDiagnosisCode;
};

export type UpdateAyurvedaDiagnosisCodeRequest = {
  code: string;
  name: string;
  category?: string;
  englishName?: string;
  icdDiagnosisCodeId?: number | null;
};

export type UpdateAyurvedaDiagnosisCodeResponse = {
  data: AyurvedaDiagnosisCode;
};

export type DeleteAyurvedaDiagnosisCodeResponse = void;
