import type { PatientRegistrationStatus } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type PatientFormMode = AnalyticsEventProperties<'patient_form_started'>['mode'];

/**
 * The edit screen opened for a Provisional Patient is completing their registration: saving it is
 * what makes them a Registered Patient.
 */
export function patientEditFormMode(
  registrationStatus: PatientRegistrationStatus
): PatientFormMode {
  return registrationStatus === 'provisional' ? 'complete_provisional' : 'edit';
}
