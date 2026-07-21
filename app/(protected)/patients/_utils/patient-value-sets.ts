// Mirrors the fixed value sets in the API contract (patient-schema.ts, ADR 0020).
// Kept here — not fetched — because these are fixed enums, not Global References.

export const PATIENT_GENDERS = ['male', 'female', 'other', 'unknown'] as const;
export const PATIENT_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const PATIENT_MARITAL_STATUSES = [
  'single',
  'married',
  'divorced',
  'widowed',
  'other',
] as const;
export const PATIENT_GOVT_ID_TYPES = [
  'passport',
  'national-id',
  'driving-license',
  'other',
] as const;
export const PATIENT_PAYMENT_METHODS = ['cash', 'insurance', 'self-pay', 'corporate'] as const;

const GENDER_LABELS: Record<(typeof PATIENT_GENDERS)[number], string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  unknown: 'Unknown',
};

const MARITAL_STATUS_LABELS: Record<(typeof PATIENT_MARITAL_STATUSES)[number], string> = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
  other: 'Other',
};

const GOVT_ID_TYPE_LABELS: Record<(typeof PATIENT_GOVT_ID_TYPES)[number], string> = {
  passport: 'Passport',
  'national-id': 'National ID',
  'driving-license': 'Driving license',
  other: 'Other',
};

const PAYMENT_METHOD_LABELS: Record<(typeof PATIENT_PAYMENT_METHODS)[number], string> = {
  cash: 'Cash',
  insurance: 'Insurance',
  'self-pay': 'Self-pay',
  corporate: 'Corporate',
};

export const PATIENT_GENDER_OPTIONS = PATIENT_GENDERS.map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

export const PATIENT_MARITAL_STATUS_OPTIONS = PATIENT_MARITAL_STATUSES.map((value) => ({
  value,
  label: MARITAL_STATUS_LABELS[value],
}));

export const PATIENT_GOVT_ID_TYPE_OPTIONS = PATIENT_GOVT_ID_TYPES.map((value) => ({
  value,
  label: GOVT_ID_TYPE_LABELS[value],
}));

export const PATIENT_PAYMENT_METHOD_OPTIONS = PATIENT_PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

export function getPatientGenderLabel(gender: string) {
  return GENDER_LABELS[gender as (typeof PATIENT_GENDERS)[number]] ?? gender;
}

export function getPatientMaritalStatusLabel(maritalStatus: string) {
  return (
    MARITAL_STATUS_LABELS[maritalStatus as (typeof PATIENT_MARITAL_STATUSES)[number]] ??
    maritalStatus
  );
}

export function getPatientGovtIdTypeLabel(govtIdType: string) {
  return GOVT_ID_TYPE_LABELS[govtIdType as (typeof PATIENT_GOVT_ID_TYPES)[number]] ?? govtIdType;
}

export function getPatientPaymentMethodLabel(paymentMethod: string) {
  return (
    PAYMENT_METHOD_LABELS[paymentMethod as (typeof PATIENT_PAYMENT_METHODS)[number]] ??
    paymentMethod
  );
}
