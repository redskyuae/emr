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
// Excludes 'emirates-id' deliberately — the Emirates ID is its own Patient
// field, not an Identity Document, so it has exactly one home (ADR 0042).
export const PATIENT_IDENTITY_DOCUMENT_TYPES = [
  'passport',
  'national-id',
  'residence-visa',
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

const IDENTITY_DOCUMENT_TYPE_LABELS: Record<
  (typeof PATIENT_IDENTITY_DOCUMENT_TYPES)[number],
  string
> = {
  passport: 'Passport',
  'national-id': 'National ID',
  'residence-visa': 'Residence visa',
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

export const PATIENT_IDENTITY_DOCUMENT_TYPE_OPTIONS = PATIENT_IDENTITY_DOCUMENT_TYPES.map(
  (value) => ({
    value,
    label: IDENTITY_DOCUMENT_TYPE_LABELS[value],
  })
);

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

export function getPatientIdentityDocumentTypeLabel(documentType: string) {
  return (
    IDENTITY_DOCUMENT_TYPE_LABELS[
      documentType as (typeof PATIENT_IDENTITY_DOCUMENT_TYPES)[number]
    ] ?? documentType
  );
}

// The card is printed 784-1990-1234567-1 but the API stores digits only, so the
// UI normalises on the way in and formats on the way out (ADR 0042).
export function normaliseEmiratesId(value: string) {
  return value.replace(/\D/g, '');
}

export function formatEmiratesId(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = normaliseEmiratesId(value);

  if (digits.length !== 15) {
    return value;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 14)}-${digits.slice(14)}`;
}

// Documents with no expiry date (a driving licence, say) are never "expired".
export function isIdentityDocumentExpired(expiryDate: string | null) {
  if (!expiryDate) {
    return false;
  }

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return expiryDate < todayIso;
}

export function getPatientPaymentMethodLabel(paymentMethod: string) {
  return (
    PAYMENT_METHOD_LABELS[paymentMethod as (typeof PATIENT_PAYMENT_METHODS)[number]] ??
    paymentMethod
  );
}
