// Properties of the Patient and Admission lifecycle events. Only yes/no flags, counts, durations and
// the Admission Type code: never who the Patient is, and never the Discharge Disposition, allergy
// severity, Patient flags or Patient Identification Category (they describe the Patient's care).

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import type {
  Patient,
  PatientRegistrationStatus,
} from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';
import { daysBetween } from './lifecycle-durations';

type RegistrationPath = AnalyticsEventProperties<'patient_registered'>['registration_path'];

/** `patient_registered`. */
export function patientRegisteredProperties(
  patient: Pick<Patient, 'emiratesId' | 'isMedicalTourist' | 'identityDocuments'>,
  registrationPath: RegistrationPath
): AnalyticsEventProperties<'patient_registered'> {
  return {
    registration_path: registrationPath,
    has_emirates_id: Boolean(patient.emiratesId),
    is_medical_tourist: patient.isMedicalTourist,
    identity_document_count: patient.identityDocuments.length,
  };
}

/**
 * A Patient update that turned a Provisional Patient into a Registered Patient completes that
 * registration. Any other update registers nobody, so there is no path.
 */
export function registrationPathAfterUpdate(
  previousStatus: PatientRegistrationStatus,
  patient: Pick<Patient, 'registrationStatus'>
): RegistrationPath | undefined {
  return previousStatus === 'provisional' && patient.registrationStatus === 'registered'
    ? 'completed_provisional'
    : undefined;
}

/** `patient_admitted`. */
export function patientAdmittedProperties(
  admission: Admission
): AnalyticsEventProperties<'patient_admitted'> {
  return {
    admission_type_code: admission.admissionType.code,
    from_visit: admission.visit !== null,
    has_expected_discharge_date: admission.expectedDischargeDate !== null,
  };
}

/** `admission_discharged`. The Discharge Disposition is deliberately not sent. */
export function admissionDischargedProperties(
  admission: Admission
): AnalyticsEventProperties<'admission_discharged'> {
  return {
    length_of_stay_days: daysBetween(
      admission.admittedAt,
      admission.dischargedAt ?? admission.admittedAt
    ),
    has_discharge_summary: Boolean(admission.dischargeSummary),
  };
}
