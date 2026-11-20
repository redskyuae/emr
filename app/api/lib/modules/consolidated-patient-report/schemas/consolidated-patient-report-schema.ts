import { z } from 'zod';

import type { PatientTreatmentPlanStatus } from '../../patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { MedicationStatus } from '../../patient-medication/schemas/patient-medication-schema';
import type {
  PatientBloodGroup,
  PatientGender,
  PatientTitle,
} from '../../patient/schemas/patient-schema';
import type {
  VisitDiagnosisCodeSystem,
  VisitDiagnosisType,
} from '../../visit-diagnosis/schemas/visit-diagnosis-schema';
import type { VisitStatus } from '../../visit/schemas/visit-schema';

// A report covers at most a year, so one request never reads an unbounded Visit history.
export const CONSOLIDATED_REPORT_MAX_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;

/** `DD-MM-YYYY` as an ISO date, or `undefined` when it is not a real calendar date. */
export function toIsoDate(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) return undefined;

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);

  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? undefined : iso;
}

const reportDateSchema = (fieldName: string) =>
  z
    .string({ error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`)
    .transform((value, context) => {
      const isoDate = toIsoDate(value);

      if (!isoDate) {
        context.addIssue({ code: 'custom', message: `${fieldName} must be in DD-MM-YYYY format` });
        return z.NEVER;
      }

      return isoDate;
    });

/** The report period, both ends included, as `DD-MM-YYYY` in and ISO dates out. */
export const consolidatedReportPeriodSchema = z
  .object({
    toDate: reportDateSchema('To date'),
    fromDate: reportDateSchema('From date'),
  })
  .superRefine(({ fromDate, toDate }, context) => {
    if (fromDate > toDate) {
      context.addIssue({
        code: 'custom',
        path: ['toDate'],
        message: 'From date must be on or before To date',
      });
      return;
    }

    const days = (Date.parse(toDate) - Date.parse(fromDate)) / DAY_MS + 1;

    if (days > CONSOLIDATED_REPORT_MAX_DAYS) {
      context.addIssue({
        code: 'custom',
        path: ['toDate'],
        message: `Report period must be at most ${CONSOLIDATED_REPORT_MAX_DAYS} days`,
      });
    }
  });

export type ConsolidatedReportParams = {
  toDate: string;
  fromDate: string;
  tenantId: string;
  patientId: number;
};

export type ConsolidatedReportOptions = {
  generatedBy: string | null;
};

export type ConsolidatedReportPatient = {
  id: number;
  mrn: string;
  city: string | null;
  phone: string;
  state: string | null;
  title: PatientTitle | null;
  gender: PatientGender | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
  bloodGroup: PatientBloodGroup | null;
  dateOfBirth: string | null;
  registeredOn: Date;
};

export type ConsolidatedReportDoctor = {
  name: string;
  specialtyName: string | null;
  qualifications: string | null;
};

export type ConsolidatedReportDiagnosis = {
  code: string;
  title: string;
  codeSystem: VisitDiagnosisCodeSystem;
  englishName: string | null;
  diagnosisType: VisitDiagnosisType;
  firstRecordedOn: string;
};

export type ConsolidatedReportTreatmentPlan = {
  id: number;
  status: PatientTreatmentPlanStatus;
  procedures: string[];
  treatmentName: string;
  totalSessions: number;
  sessionsInPeriod: number;
  completedSessions: number;
};

export type ConsolidatedReportMedication = {
  id: number;
  dose: string | null;
  route: string | null;
  status: MedicationStatus;
  endDate: string | null;
  drugName: string;
  frequency: string | null;
  startDate: string | null;
};

export type ConsolidatedReportVisitTreatment = {
  label: string | null;
  planId: number;
  completed: boolean;
  procedure: string | null;
  sessionNumber: number;
  treatmentName: string;
  totalSessions: number;
};

export type ConsolidatedReportNote = {
  id: number;
  plan: string | null;
  visitId: number;
  signedAt: Date | null;
  objective: string | null;
  subjective: string | null;
  assessment: string | null;
  authorName: string | null;
  noteType: { name: string; code: string };
};

export type ConsolidatedReportVisit = {
  id: number;
  notes: ConsolidatedReportNote[];
  status: VisitStatus;
  visitDate: string;
  painScore: number | null;
  treatments: ConsolidatedReportVisitTreatment[];
  doctorName: string | null;
  visitNumber: string;
  chiefComplaint: string | null;
};

export type ConsolidatedReportLatestPlan = {
  plan: string;
  authorName: string | null;
  visitNumber: string;
};

export type ConsolidatedPatientReport = {
  tenant: { name: string; logo: string | null };
  period: { fromDate: string; toDate: string };
  visits: ConsolidatedReportVisit[];
  patient: ConsolidatedReportPatient;
  timeZone: string;
  diagnoses: ConsolidatedReportDiagnosis[];
  latestPlan: ConsolidatedReportLatestPlan | null;
  generatedAt: Date;
  generatedBy: string | null;
  medications: ConsolidatedReportMedication[];
  chiefComplaint: string | null;
  treatmentPlans: ConsolidatedReportTreatmentPlan[];
  consultingDoctor: ConsolidatedReportDoctor | null;
};
