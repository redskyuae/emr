import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';

export type GetPatientChartResponse = {
  data: PatientChart;
};
