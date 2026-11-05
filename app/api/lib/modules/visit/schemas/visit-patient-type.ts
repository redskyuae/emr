export type VisitPatientType = 'NEW' | 'ESTABLISHED';

export type VisitPatientTypeAssessment = {
  patientType: VisitPatientType;
  patientRecordDate: string;
  lookbackStartDate: string;
  lastCompletedVisit: { visitNumber: string; visitDate: string } | null;
};

/** Inclusive three-calendar-year window, clamping 29 February to 28 February. */
export function threeYearLookbackStart(referenceDate: string): string {
  const [year, month, day] = referenceDate.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year - 3, month, 0)).getUTCDate();
  return `${year - 3}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}
