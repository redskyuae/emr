import { z } from 'zod';

const PATIENT_GENDERS = ['male', 'female', 'other', 'unknown'] as const;
const PATIENT_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const PATIENT_MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed', 'other'] as const;
const PATIENT_GOVT_ID_TYPES = ['passport', 'national-id', 'driving-license', 'other'] as const;
const PATIENT_PAYMENT_METHODS = ['cash', 'insurance', 'self-pay', 'corporate'] as const;
const PATIENT_REGISTRATION_STATUSES = ['provisional', 'registered'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalTrimmedValue = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, schema.optional());

const requiredMasterIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `Patient ${fieldName} is required` })
    .int(`Patient ${fieldName} must be an integer`)
    .positive(`Patient ${fieldName} must be positive`);

const optionalMasterIdSchema = (fieldName: string) =>
  z.preprocess((value) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    return value;
  }, requiredMasterIdSchema(fieldName).optional());

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isNotFutureDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return date <= today;
}

const dateOfBirthSchema = z
  .string({ error: 'Date of birth is required' })
  .trim()
  .min(1, 'Date of birth is required')
  .refine(isValidDateOnly, 'Date of birth must be a valid date')
  .refine(isNotFutureDate, 'Date of birth must not be in the future');

const patientNameSchema = (fieldName: string) =>
  z
    .string({ error: `Patient ${fieldName} is required` })
    .trim()
    .min(1, `Patient ${fieldName} cannot be empty`)
    .max(100, `Patient ${fieldName} must be at most 100 characters`);

const patientPhoneSchema = (fieldName: string) =>
  z
    .string({ error: `Patient ${fieldName} is required` })
    .trim()
    .min(1, `Patient ${fieldName} cannot be empty`)
    .max(20, `Patient ${fieldName} must be at most 20 characters`);

const patientEmailSchema = z
  .string()
  .trim()
  .max(255, 'Patient email must be at most 255 characters')
  .email('Patient email must be valid');

const genderSchema = z.enum(PATIENT_GENDERS, { error: 'Patient gender is invalid' });
const bloodGroupSchema = z.enum(PATIENT_BLOOD_GROUPS, { error: 'Patient blood group is invalid' });
const maritalStatusSchema = z.enum(PATIENT_MARITAL_STATUSES, {
  error: 'Patient marital status is invalid',
});
const govtIdTypeSchema = z.enum(PATIENT_GOVT_ID_TYPES, {
  error: 'Patient government ID type is invalid',
});
const paymentMethodSchema = z.enum(PATIENT_PAYMENT_METHODS, {
  error: 'Patient preferred payment method is invalid',
});

export const patientIdSchema = z.coerce
  .number({ error: 'Patient ID is required' })
  .int('Patient ID must be an integer')
  .positive('Patient ID must be positive');

export const patientTenantIdSchema = tenantIdSchema;

const patientPayloadSchema = z
  .object({
    firstName: patientNameSchema('first name'),
    middleName: optionalTrimmedValue(
      z.string().trim().max(100, 'Patient middle name must be at most 100 characters')
    ),
    lastName: patientNameSchema('last name'),
    gender: genderSchema,
    dateOfBirth: dateOfBirthSchema,
    bloodGroup: optionalTrimmedValue(bloodGroupSchema),
    maritalStatus: optionalTrimmedValue(maritalStatusSchema),
    preferredPaymentMethod: optionalTrimmedValue(paymentMethodSchema),
    phone: patientPhoneSchema('phone'),
    alternatePhone: optionalTrimmedValue(patientPhoneSchema('alternate phone')),
    email: optionalTrimmedValue(patientEmailSchema),
    addressLine1: optionalTrimmedValue(
      z.string().trim().max(255, 'Patient address line 1 must be at most 255 characters')
    ),
    addressLine2: optionalTrimmedValue(
      z.string().trim().max(255, 'Patient address line 2 must be at most 255 characters')
    ),
    city: optionalTrimmedValue(
      z.string().trim().max(100, 'Patient city must be at most 100 characters')
    ),
    stateId: optionalMasterIdSchema('state ID'),
    countryId: optionalMasterIdSchema('country ID'),
    postalCode: optionalTrimmedValue(
      z.string().trim().max(20, 'Patient postal code must be at most 20 characters')
    ),
    nationalityId: optionalMasterIdSchema('nationality ID'),
    languageId: optionalMasterIdSchema('language ID'),
    religionId: optionalMasterIdSchema('religion ID'),
    govtIdType: optionalTrimmedValue(govtIdTypeSchema),
    govtIdNumber: optionalTrimmedValue(
      z.string().trim().max(50, 'Patient government ID number must be at most 50 characters')
    ),
    emergencyContactName: optionalTrimmedValue(
      z.string().trim().max(150, 'Patient emergency contact name must be at most 150 characters')
    ),
    emergencyContactRelationship: optionalTrimmedValue(
      z
        .string()
        .trim()
        .max(50, 'Patient emergency contact relationship must be at most 50 characters')
    ),
    emergencyContactPhone: optionalTrimmedValue(patientPhoneSchema('emergency contact phone')),
  })
  .refine((data) => (data.govtIdType === undefined) === (data.govtIdNumber === undefined), {
    message: 'Patient government ID type and number must be provided together',
    path: ['govtIdNumber'],
  })
  .refine((data) => data.stateId === undefined || data.countryId !== undefined, {
    message: 'Patient country ID is required when state ID is provided',
    path: ['countryId'],
  });

export const createPatientSchema = patientPayloadSchema;
export const updatePatientSchema = patientPayloadSchema;

export type PatientGender = (typeof PATIENT_GENDERS)[number];
export type PatientBloodGroup = (typeof PATIENT_BLOOD_GROUPS)[number];
export type PatientMaritalStatus = (typeof PATIENT_MARITAL_STATUSES)[number];
export type PatientGovtIdType = (typeof PATIENT_GOVT_ID_TYPES)[number];
export type PatientPaymentMethod = (typeof PATIENT_PAYMENT_METHODS)[number];
export type PatientRegistrationStatus = (typeof PATIENT_REGISTRATION_STATUSES)[number];

export type PatientIdInput = z.infer<typeof patientIdSchema>;
export type PatientTenantIdInput = z.infer<typeof patientTenantIdSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type CreatePatientData = CreatePatientInput & { tenantId: string };
export type UpdatePatientData = UpdatePatientInput & { tenantId: string };

export type PatientReferenceSummary = {
  id: number;
  name: string;
};

export type PatientCountrySummary = {
  id: number;
  name: string;
  code: string;
};

export type Patient = {
  id: number;
  tenantId: string;
  mrn: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: PatientGender | null;
  dateOfBirth: string | null;
  bloodGroup: PatientBloodGroup | null;
  maritalStatus: PatientMaritalStatus | null;
  preferredPaymentMethod: PatientPaymentMethod | null;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateId: number | null;
  state: PatientReferenceSummary | null;
  countryId: number | null;
  country: PatientCountrySummary | null;
  postalCode: string | null;
  nationalityId: number | null;
  nationality: PatientReferenceSummary | null;
  languageId: number | null;
  language: PatientReferenceSummary | null;
  religionId: number | null;
  religion: PatientReferenceSummary | null;
  govtIdType: PatientGovtIdType | null;
  govtIdNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  isActive: boolean;
  registrationStatus: PatientRegistrationStatus;
  createdOn: Date;
  modifiedOn: Date;
};

export type PatientListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
  gender?: PatientGender;
  isActive?: boolean;
};
