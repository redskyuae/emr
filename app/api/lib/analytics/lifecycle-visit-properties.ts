// Properties of the Visit and clinical record lifecycle events. Built from the records the commands
// returned: Master codes, fixed categories, counts and durations only. No clinical content (notes,
// readings, diagnosis codes, Treatment names) and no record ids are read into an event.

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import {
  ACCEPTED_VISIT_DOCUMENT_TYPES,
  type VisitDocument,
} from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';
import { daysBetween, minutesBetween, minutesVsLocalStart } from './lifecycle-durations';

/** The measurements a Vital Signs reading can carry. BMI is derived, so it is not counted. */
const VITAL_SIGN_FIELDS = [
  'heightCm',
  'weightKg',
  'systolic',
  'diastolic',
  'pulseBpm',
  'respRate',
  'temperatureC',
  'spo2',
  'painScore',
] as const satisfies readonly (keyof PatientVitalSign)[];

type CheckInContext = {
  documentCount: number;
  timeZone?: string;
  appointmentStartTime?: string | null;
};

/** `visit_checked_in`. The offset is set only for an Appointment Check-in with a booked start. */
export function visitCheckedInProperties(
  visit: Visit,
  context: CheckInContext
): AnalyticsEventProperties<'visit_checked_in'> {
  const { documentCount, timeZone, appointmentStartTime } = context;

  return {
    check_in_mode: visit.appointment ? 'appointment' : 'walk_in',
    visit_type_code: visit.visitType.code,
    admit_source_code: visit.admitSource?.code,
    has_doctor: visit.doctor !== null,
    has_treatment_session: visit.treatmentSession !== null,
    document_count: documentCount,
    minutes_vs_appointment_start:
      visit.appointment && appointmentStartTime && timeZone
        ? minutesVsLocalStart(visit.checkedInAt, appointmentStartTime, timeZone)
        : undefined,
  };
}

/** `visit_consultation_started`. */
export function visitConsultationStartedProperties(
  visit: Visit
): AnalyticsEventProperties<'visit_consultation_started'> {
  return {
    visit_type_code: visit.visitType.code,
    minutes_since_check_in: minutesBetween(
      visit.checkedInAt,
      visit.consultationStartedAt ?? visit.checkedInAt
    ),
  };
}

/** `visit_completed`. */
export function visitCompletedProperties(
  visit: Visit
): AnalyticsEventProperties<'visit_completed'> {
  const completedAt = visit.completedAt ?? visit.checkedInAt;

  return {
    visit_type_code: visit.visitType.code,
    minutes_since_check_in: minutesBetween(visit.checkedInAt, completedAt),
    minutes_in_consultation: visit.consultationStartedAt
      ? minutesBetween(visit.consultationStartedAt, completedAt)
      : undefined,
  };
}

/**
 * `visit_cancelled`. Only a Checked In or In Consultation Visit can be cancelled, so the status it
 * left is read from whether the consultation had started.
 */
export function visitCancelledProperties(
  visit: Visit
): AnalyticsEventProperties<'visit_cancelled'> {
  return {
    from_status: visit.consultationStartedAt ? 'IN_CONSULTATION' : 'CHECKED_IN',
    minutes_since_check_in: minutesBetween(
      visit.checkedInAt,
      visit.cancelledAt ?? visit.checkedInAt
    ),
  };
}

/** `visit_amended`, for any part of a Completed Visit. */
export function visitAmendedProperties(
  amendedPart: AnalyticsEventProperties<'visit_amended'>['amended_part'],
  completedAt: Date | null | undefined,
  now = new Date()
): AnalyticsEventProperties<'visit_amended'> {
  return {
    amended_part: amendedPart,
    days_since_completed: completedAt ? daysBetween(completedAt, now) : undefined,
  };
}

/** `visit_diagnoses_saved`: how many entries of each code system, never which codes. */
export function visitDiagnosesSavedProperties(
  diagnoses: readonly Pick<VisitDiagnosis, 'codeSystem'>[]
): AnalyticsEventProperties<'visit_diagnoses_saved'> {
  return {
    icd10_count: diagnoses.filter((diagnosis) => diagnosis.codeSystem === 'ICD10CM').length,
    ayurveda_count: diagnoses.filter((diagnosis) => diagnosis.codeSystem === 'AYURVEDA').length,
  };
}

/** `visit_document_added` and `visit_document_removed`: the file's type, never its name. */
export function visitDocumentProperties(
  document: Pick<VisitDocument, 'contentType'>
): AnalyticsEventProperties<'visit_document_added'> {
  const contentType = document.contentType.trim().toLowerCase();

  return { content_type: isAcceptedDocumentType(contentType) ? contentType : undefined };
}

type AcceptedDocumentType = (typeof ACCEPTED_VISIT_DOCUMENT_TYPES)[number];

function isAcceptedDocumentType(value: string): value is AcceptedDocumentType {
  return (ACCEPTED_VISIT_DOCUMENT_TYPES as readonly string[]).includes(value);
}

function clinicalContext(record: { visitId: number | null; admissionId: number | null }) {
  if (record.visitId !== null) return 'visit' as const;
  if (record.admissionId !== null) return 'admission' as const;
  return 'patient' as const;
}

/** `clinical_note_created`. */
export function clinicalNoteCreatedProperties(
  note: ClinicalNote,
  noteTypeCode: string | null | undefined
): AnalyticsEventProperties<'clinical_note_created'> {
  return { note_type_code: noteTypeCode, context: clinicalContext(note) };
}

/** `clinical_note_signed`. */
export function clinicalNoteSignedProperties(
  note: ClinicalNote,
  noteTypeCode: string | null | undefined
): AnalyticsEventProperties<'clinical_note_signed'> {
  return {
    note_type_code: noteTypeCode,
    minutes_since_created: minutesBetween(note.createdOn, note.signedAt ?? note.createdOn),
  };
}

/** `vital_signs_recorded`: how many measurements were taken, never their values. */
export function vitalSignsRecordedProperties(
  vitalSign: PatientVitalSign
): AnalyticsEventProperties<'vital_signs_recorded'> {
  return {
    context: clinicalContext(vitalSign),
    fields_recorded_count: VITAL_SIGN_FIELDS.filter(
      (field) => vitalSign[field] !== null && vitalSign[field] !== undefined
    ).length,
  };
}

/** `treatment_plan_assigned`. */
export function treatmentPlanAssignedProperties(
  plan: Pick<PatientTreatmentPlan, 'sessionStructure' | 'totalSessions'>
): AnalyticsEventProperties<'treatment_plan_assigned'> {
  return { session_structure: plan.sessionStructure, session_count: plan.totalSessions };
}

/** `treatment_plan_sessions_added`, from the accepted payload's `sessions` count. */
export function treatmentPlanSessionsAddedProperties(
  payload: unknown
): AnalyticsEventProperties<'treatment_plan_sessions_added'> {
  const sessions =
    typeof payload === 'object' && payload !== null && 'sessions' in payload
      ? payload.sessions
      : undefined;

  return { added_count: typeof sessions === 'number' ? sessions : 0 };
}
