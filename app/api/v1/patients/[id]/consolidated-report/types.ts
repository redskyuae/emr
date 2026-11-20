import type { ConsolidatedPatientReport } from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';

export type GetConsolidatedPatientReportResponse = {
  data: ConsolidatedPatientReport;
};
