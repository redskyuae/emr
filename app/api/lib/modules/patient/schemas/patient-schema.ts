import { z } from 'zod';

const PATIENT_GENDERS = ['male', 'female', 'other', 'unknown'] as const;
const PATIENT_TITLES = ['mr', 'mrs', 'miss', 'baby', 'master', 'ms', 'dr'] as const;
const PATIENT_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const PATIENT_MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed', 'other'] as const;
const PATIENT_IDENTIFICATION_CATEGORIES = [
  'uae-national-without-card',
  'national-without-card',
  'expatriate-resident-without-card',
  'non-expatriate-resident-without-card',
  'unknown-status-without-card',
] as const;
const PATIENT_IDENTIFICATION_CATEGORY_DEFAULT_IDS: Record<
  (typeof PATIENT_IDENTIFICATION_CATEGORIES)[number],
  string
> = {
  'uae-national-without-card': '000000000000000',
  'national-without-card': '000000000000000',
  'expatriate-resident-without-card': '111111111111111',
  'non-expatriate-resident-without-card': '222222222222222',
  'unknown-status-without-card': '999999999999999',
};
// Deliberately excludes 'emirates-id'. The Emirates ID is a singleton by law
// and lives in its own column on patient, so it has exactly one home (ADR 0042).
const PATIENT_IDENTITY_DOCUMENT_TYPES = [
  'passport',
  'national-id',
  'residence-visa',
  'driving-license',
  'other',
] as const;
const PATIENT_PAYMENT_METHODS = ['cash', 'insurance', 'self-pay', 'corporate'] as const;
const PATIENT_REGISTRATION_STATUSES = ['provisional', 'registered'] as const;
const PATIENT_RACES = ['arab', 'asian', 'black', 'white', 'mixed', 'other', 'unknown'] as const;
const PATIENT_ETHNIC_GROUPS = [
  'emirati',
  'gcc-national',
  'arab',
  'south-asian',
  'southeast-asian',
  'african',
  'european',
  'other',
  'unknown',
] as const;

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
const titleSchema = z.enum(PATIENT_TITLES, { error: 'Patient title is invalid' });
const bloodGroupSchema = z.enum(PATIENT_BLOOD_GROUPS, { error: 'Patient blood group is invalid' });
const maritalStatusSchema = z.enum(PATIENT_MARITAL_STATUSES, {
  error: 'Patient marital status is invalid',
});
const patientIdentificationCategorySchema = z.enum(PATIENT_IDENTIFICATION_CATEGORIES, {
  error: 'Patient Identification Category is invalid',
});
const paymentMethodSchema = z.enum(PATIENT_PAYMENT_METHODS, {
  error: 'Patient preferred payment method is invalid',
});
const raceSchema = z.enum(PATIENT_RACES, { error: 'Patient race is invalid' });
const ethnicGroupSchema = z.enum(PATIENT_ETHNIC_GROUPS, {
  error: 'Patient ethnic group is invalid',
});

function isPatientPhotoUrl(value: string) {
  if (/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

// The card is printed 784-1990-1234567-1; only the digits are stored. Without
// this, three spellings of one ID all pass the unique index as three patients.
export function normaliseEmiratesId(value: string) {
  return value.replace(/\D/g, '');
}

export function getPatientIdentificationCategoryDefaultEmiratesId(
  category: PatientIdentificationCategory
) {
  return PATIENT_IDENTIFICATION_CATEGORY_DEFAULT_IDS[category];
}

export function isRealEmiratesId(value: string | null | undefined) {
  return /^784\d{12}$/.test(normaliseEmiratesId(value ?? ''));
}

// Shape only — never the check digit. The ICP has not published the algorithm,
// and a false rejection turns away a patient holding a valid card (ADR 0042).
const emiratesIdSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const digits = normaliseEmiratesId(value);
    return digits === '' ? undefined : digits;
  },
  z
    .string()
    .regex(/^\d{15}$/, 'Patient Emirates ID must be 15 digits')
    .optional()
);

const identityDocumentNumberSchema = z
  .string({ error: 'Identity document number is required' })
  .trim()
  .min(1, 'Identity document number cannot be empty')
  .max(50, 'Identity document number must be at most 50 characters');

const identityDocumentExpirySchema = z
  .string({ error: 'Identity document expiry date is required' })
  .trim()
  .refine(isValidDateOnly, 'Identity document expiry date must be a valid date');

const identityDocumentIdSchema = z.coerce
  .number()
  .int('Identity document ID must be an integer')
  .positive('Identity document ID must be positive')
  .optional();

// A discriminated union rather than all-optional columns: the required metadata
// genuinely differs per type, and only the type knows which fields mean anything.
// Passport requires an issuing country because passport numbers are unique only
// within the country that issued them.
const identityDocumentSchema = z.discriminatedUnion(
  'documentType',
  [
    z
      .object({
        id: identityDocumentIdSchema,
        documentType: z.literal('passport'),
        documentNumber: identityDocumentNumberSchema,
        issuingCountryId: requiredMasterIdSchema('passport issuing country ID'),
        expiryDate: identityDocumentExpirySchema,
      })
      .strict(),
    z
      .object({
        id: identityDocumentIdSchema,
        documentType: z.literal('national-id'),
        documentNumber: identityDocumentNumberSchema,
        issuingCountryId: requiredMasterIdSchema('national ID issuing country ID'),
        expiryDate: optionalTrimmedValue(identityDocumentExpirySchema),
      })
      .strict(),
    z
      .object({
        id: identityDocumentIdSchema,
        documentType: z.literal('residence-visa'),
        documentNumber: identityDocumentNumberSchema,
        expiryDate: identityDocumentExpirySchema,
      })
      .strict(),
    z
      .object({
        id: identityDocumentIdSchema,
        documentType: z.literal('driving-license'),
        documentNumber: identityDocumentNumberSchema,
        issuingCountryId: optionalMasterIdSchema('driving license issuing country ID'),
        expiryDate: optionalTrimmedValue(identityDocumentExpirySchema),
      })
      .strict(),
    z
      .object({
        id: identityDocumentIdSchema,
        documentType: z.literal('other'),
        documentNumber: identityDocumentNumberSchema,
        issuingCountryId: optionalMasterIdSchema('identity document issuing country ID'),
        expiryDate: optionalTrimmedValue(identityDocumentExpirySchema),
        label: optionalTrimmedValue(
          z.string().trim().max(100, 'Identity document label must be at most 100 characters')
        ),
      })
      .strict(),
  ],
  { error: 'Identity document type is invalid' }
);

export const patientIdSchema = z.coerce
  .number({ error: 'Patient ID is required' })
  .int('Patient ID must be an integer')
  .positive('Patient ID must be positive');

export const patientTenantIdSchema = tenantIdSchema;

const patientPayloadSchema = z
  .object({
    title: titleSchema,
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
    race: optionalTrimmedValue(raceSchema),
    ethnicGroup: optionalTrimmedValue(ethnicGroupSchema),
    emiratesId: emiratesIdSchema,
    photoUrl: optionalTrimmedValue(
      z
        .string()
        .trim()
        .max(1_500_000, 'Patient photo must be at most 1.5MB')
        .refine(
          isPatientPhotoUrl,
          'Patient photo must be an HTTP(S) URL or image data URL from Emirates ID read'
        )
    ),
    patientIdentificationCategory: optionalTrimmedValue(patientIdentificationCategorySchema),
    passportNumber: optionalTrimmedValue(
      z.string().trim().max(50, 'Patient passport number must be at most 50 characters')
    ),
    uid: optionalTrimmedValue(
      z.string().trim().max(30, 'Patient UID must be at most 30 characters')
    ),
    isVip: z.boolean().optional(),
    smsConsent: z.boolean().optional(),
    isMedicalTourist: z.boolean().optional(),
    identityDocuments: z.array(identityDocumentSchema).optional(),
    emergencyContactName: optionalTrimmedValue(
      z.string().trim().max(150, 'Patient Next of Kin must be at most 150 characters')
    ),
    emergencyContactRelationship: optionalTrimmedValue(
      z.string().trim().max(50, 'Patient Next of Kin Relationship must be at most 50 characters')
    ),
    emergencyContactGender: optionalTrimmedValue(genderSchema),
    emergencyContactPhone: optionalTrimmedValue(patientPhoneSchema('Next of Kin phone')),
  })
  .refine((data) => data.stateId === undefined || data.countryId !== undefined, {
    message: 'Patient country ID is required when state ID is provided',
    path: ['countryId'],
  })
  .superRefine((data, ctx) => {
    const hasRealEmiratesId = isRealEmiratesId(data.emiratesId);
    const expectedCategoryDefaultId =
      data.patientIdentificationCategory === undefined
        ? undefined
        : getPatientIdentificationCategoryDefaultEmiratesId(data.patientIdentificationCategory);
    const hasCategoryDefaultEmiratesId =
      data.emiratesId !== undefined && data.emiratesId === expectedCategoryDefaultId;

    if (data.emiratesId !== undefined && !hasRealEmiratesId && !hasCategoryDefaultEmiratesId) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Patient Emirates ID must be 15 digits beginning with 784 or match Patient Identification Category default',
        path: ['emiratesId'],
      });
    }

    if (data.emiratesId === undefined && data.patientIdentificationCategory === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Patient Identification Category is required when Emirates ID is absent',
        path: ['patientIdentificationCategory'],
      });
    }

    if (data.photoUrl !== undefined && !hasRealEmiratesId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Patient photo can only be saved with Emirates ID',
        path: ['photoUrl'],
      });
    }

    if (data.isMedicalTourist && hasRealEmiratesId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Medical Tourist cannot have Emirates ID',
        path: ['emiratesId'],
      });
    }

    if (data.isMedicalTourist && data.uid === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Patient UID is required for Medical Tourist',
        path: ['uid'],
      });
    }
  });

export const createPatientSchema = patientPayloadSchema;
export const updatePatientSchema = patientPayloadSchema;

export type PatientGender = (typeof PATIENT_GENDERS)[number];
export type PatientTitle = (typeof PATIENT_TITLES)[number];
export type PatientBloodGroup = (typeof PATIENT_BLOOD_GROUPS)[number];
export type PatientMaritalStatus = (typeof PATIENT_MARITAL_STATUSES)[number];
export type PatientIdentificationCategory = (typeof PATIENT_IDENTIFICATION_CATEGORIES)[number];
export type PatientIdentityDocumentType = (typeof PATIENT_IDENTITY_DOCUMENT_TYPES)[number];
export type PatientPaymentMethod = (typeof PATIENT_PAYMENT_METHODS)[number];
export type PatientRegistrationStatus = (typeof PATIENT_REGISTRATION_STATUSES)[number];
export type PatientRace = (typeof PATIENT_RACES)[number];
export type PatientEthnicGroup = (typeof PATIENT_ETHNIC_GROUPS)[number];

export type PatientIdInput = z.infer<typeof patientIdSchema>;
export type PatientTenantIdInput = z.infer<typeof patientTenantIdSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type CreatePatientData = CreatePatientInput & { tenantId: string };
export type UpdatePatientData = UpdatePatientInput & { tenantId: string };

export type PatientIdentityDocumentInput = z.infer<typeof identityDocumentSchema>;

export type PatientReferenceSummary = {
  id: number;
  name: string;
};

export type PatientCountrySummary = {
  id: number;
  name: string;
  code: string;
};

// Flat with nullable fields, matching the stored row — the per-type rules in
// the discriminated union govern requests, not responses.
export type PatientIdentityDocument = {
  id: number;
  documentType: PatientIdentityDocumentType;
  documentNumber: string;
  issuingCountryId: number | null;
  issuingCountry: PatientCountrySummary | null;
  expiryDate: string | null;
  label: string | null;
};

export type Patient = {
  id: number;
  tenantId: string;
  mrn: string;
  title: PatientTitle | null;
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
  race: PatientRace | null;
  ethnicGroup: PatientEthnicGroup | null;
  emiratesId: string | null;
  photoUrl: string | null;
  patientIdentificationCategory: PatientIdentificationCategory | null;
  passportNumber: string | null;
  uid: string | null;
  isVip: boolean;
  smsConsent: boolean;
  isMedicalTourist: boolean;
  identityDocuments: PatientIdentityDocument[];
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactGender: PatientGender | null;
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
