import type { DiagnosisCode } from '@/app/api/lib/modules/diagnosis-code/schemas/diagnosis-code-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListDiagnosisCodesResponse = Paginated<DiagnosisCode>;

export type SaveDiagnosisCodeRequest = {
  code: string;
  title: string;
  category?: string;
};

export type SaveDiagnosisCodeResponse = {
  data: DiagnosisCode;
};
