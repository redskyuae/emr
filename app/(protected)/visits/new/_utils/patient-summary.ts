import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';

type NamedPatient = Pick<Patient, 'firstName' | 'middleName' | 'lastName'>;

export function patientDisplayName(patient: NamedPatient) {
  return [patient.firstName, patient.middleName, patient.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export function patientInitials(patient: NamedPatient) {
  const first = patient.firstName.trim().charAt(0);
  const last = patient.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || '?';
}

export function patientAddressSummary(
  patient: Pick<Patient, 'addressLine1' | 'city' | 'state' | 'country'>
) {
  const parts = [patient.addressLine1, patient.city, patient.state?.name ?? patient.country?.name]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export function emergencyContactSummary(
  patient: Pick<Patient, 'emergencyContactName' | 'emergencyContactRelationship'>
) {
  const name = patient.emergencyContactName?.trim();
  if (!name) return null;
  const relationship = patient.emergencyContactRelationship?.trim();
  return relationship ? `${name} · ${relationship}` : name;
}
