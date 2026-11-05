import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAyurvedaDiagnosisCodesResponse = Paginated<AyurvedaDiagnosisCode>;

export type SaveAyurvedaDiagnosisCodeRequest = {
  code: string;
  title: string;
  category?: string;
};

export type SaveAyurvedaDiagnosisCodeResponse = {
  data: AyurvedaDiagnosisCode;
};
