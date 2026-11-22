// Builds the field-level before/after of an Audit Event. Only the listed fields
// are compared, so an Audit Event never carries a field nobody chose to audit,
// and nested summaries (`doctor.name`) record what a person reads, not an id.

import {
  AUDIT_CHANGE_VALUE_MAX_LENGTH,
  type AuditChange,
} from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';

export type AuditField = { path: string; label: string };

type AuditValue = string | number | boolean | null;

function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || value === undefined || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function toAuditValue(value: unknown): AuditValue {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();

  const text = typeof value === 'string' ? value : JSON.stringify(value);

  return text.length > AUDIT_CHANGE_VALUE_MAX_LENGTH
    ? `${text.slice(0, AUDIT_CHANGE_VALUE_MAX_LENGTH)}…`
    : text;
}

export function diffAuditFields(
  before: unknown,
  after: unknown,
  fields: readonly AuditField[]
): AuditChange[] {
  return fields.flatMap(({ path, label }) => {
    const from = toAuditValue(readPath(before, path));
    const to = toAuditValue(readPath(after, path));

    return from === to ? [] : [{ field: path, label, from, to }];
  });
}

// The fields each audited entity compares. A field left out here is not audited.
export const VISIT_AUDIT_FIELDS = [
  { path: 'doctor.name', label: 'Doctor' },
  { path: 'visitType.name', label: 'Visit Type' },
  { path: 'admitSource.name', label: 'Admit Source' },
  { path: 'chiefComplaint', label: 'Chief complaint' },
  { path: 'remarks', label: 'Remarks' },
  { path: 'treatment.name', label: 'Treatment' },
  { path: 'treatmentSession.name', label: 'Treatment Session' },
  { path: 'status', label: 'Status' },
  { path: 'cancellationReason', label: 'Cancellation reason' },
] as const satisfies readonly AuditField[];

export const CLINICAL_NOTE_AUDIT_FIELDS = [
  { path: 'noteTypeId', label: 'Note type' },
  { path: 'subjective', label: 'Subjective' },
  { path: 'objective', label: 'Objective' },
  { path: 'assessment', label: 'Assessment' },
  { path: 'plan', label: 'Plan' },
  { path: 'status', label: 'Status' },
] as const satisfies readonly AuditField[];

export const VITAL_SIGN_AUDIT_FIELDS = [
  { path: 'recordedAt', label: 'Recorded at' },
  { path: 'heightCm', label: 'Height (cm)' },
  { path: 'weightKg', label: 'Weight (kg)' },
  { path: 'bmi', label: 'BMI' },
  { path: 'systolic', label: 'Systolic' },
  { path: 'diastolic', label: 'Diastolic' },
  { path: 'pulseBpm', label: 'Pulse (bpm)' },
  { path: 'respRate', label: 'Respiratory rate' },
  { path: 'temperatureC', label: 'Temperature (°C)' },
  { path: 'spo2', label: 'SpO2' },
  { path: 'painScore', label: 'Pain score' },
  { path: 'notes', label: 'Notes' },
] as const satisfies readonly AuditField[];

export const PATIENT_AUDIT_FIELDS = [
  { path: 'title', label: 'Title' },
  { path: 'firstName', label: 'First name' },
  { path: 'middleName', label: 'Middle name' },
  { path: 'lastName', label: 'Last name' },
  { path: 'gender', label: 'Gender' },
  { path: 'dateOfBirth', label: 'Date of birth' },
  { path: 'bloodGroup', label: 'Blood group' },
  { path: 'maritalStatus', label: 'Marital status' },
  { path: 'phone', label: 'Phone' },
  { path: 'alternatePhone', label: 'Alternate phone' },
  { path: 'email', label: 'Email' },
  { path: 'addressLine1', label: 'Address line 1' },
  { path: 'addressLine2', label: 'Address line 2' },
  { path: 'city', label: 'City' },
  { path: 'state.name', label: 'State' },
  { path: 'country.name', label: 'Country' },
  { path: 'postalCode', label: 'Postal code' },
  { path: 'nationality.name', label: 'Nationality' },
  { path: 'emiratesId', label: 'Emirates ID' },
  { path: 'passportNumber', label: 'Passport number' },
  { path: 'uid', label: 'UID' },
  { path: 'isVip', label: 'VIP' },
  { path: 'isMedicalTourist', label: 'Medical Tourist' },
  { path: 'emergencyContactName', label: 'Emergency contact' },
  { path: 'emergencyContactPhone', label: 'Emergency contact phone' },
  { path: 'registrationStatus', label: 'Registration status' },
  { path: 'isActive', label: 'Active' },
] as const satisfies readonly AuditField[];
