import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalInt = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => (value === null || value === undefined || value === '' ? undefined : value),
    z.coerce
      .number({ error: `${label} must be a number` })
      .int(`${label} must be an integer`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional()
  );

const optionalDecimal = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => (value === null || value === undefined || value === '' ? undefined : value),
    z.coerce
      .number({ error: `${label} must be a number` })
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional()
  );

const optionalVisitId = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z.coerce
    .number({ error: 'Vital sign visit ID must be a number' })
    .int('Vital sign visit ID must be an integer')
    .positive('Vital sign visit ID must be positive')
    .optional()
);

const optionalAdmissionId = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z.coerce
    .number({ error: 'Vital sign admission ID must be a number' })
    .int('Vital sign admission ID must be an integer')
    .positive('Vital sign admission ID must be positive')
    .optional()
);

const optionalNotes = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().max(2000, 'Vital sign notes must be at most 2000 characters').optional());

const optionalRecordedAt = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z.coerce.date({ error: 'Vital sign recorded-at must be a valid date-time' }).optional()
);

const MEASUREMENT_KEYS = [
  'heightCm',
  'weightKg',
  'systolic',
  'diastolic',
  'pulseBpm',
  'respRate',
  'temperatureC',
  'spo2',
  'painScore',
] as const;

export const patientVitalSignIdSchema = z.coerce
  .number({ error: 'Vital sign ID is required' })
  .int('Vital sign ID must be an integer')
  .positive('Vital sign ID must be positive');

export const patientVitalSignTenantIdSchema = tenantIdSchema;

export const patientVitalSignPayloadSchema = z
  .object({
    visitId: optionalVisitId,
    admissionId: optionalAdmissionId,
    recordedAt: optionalRecordedAt,
    heightCm: optionalDecimal('Vital sign height', 0, 300),
    weightKg: optionalDecimal('Vital sign weight', 0, 700),
    systolic: optionalInt('Vital sign systolic', 0, 400),
    diastolic: optionalInt('Vital sign diastolic', 0, 400),
    pulseBpm: optionalInt('Vital sign pulse', 0, 400),
    respRate: optionalInt('Vital sign respiratory rate', 0, 150),
    temperatureC: optionalDecimal('Vital sign temperature', 20, 45),
    spo2: optionalInt('Vital sign SpO2', 0, 100),
    painScore: optionalInt('Vital sign pain score', 0, 10),
    notes: optionalNotes,
  })
  .refine((data) => MEASUREMENT_KEYS.some((key) => data[key] !== undefined), {
    message: 'At least one vital sign measurement is required',
    path: ['heightCm'],
  })
  .refine((data) => !(data.visitId !== undefined && data.admissionId !== undefined), {
    message: 'A record may reference a Visit or an Admission, not both.',
    path: ['admissionId'],
  });

export const createPatientVitalSignSchema = patientVitalSignPayloadSchema;
export const updatePatientVitalSignSchema = patientVitalSignPayloadSchema;

export type PatientVitalSignIdInput = z.infer<typeof patientVitalSignIdSchema>;
export type CreatePatientVitalSignInput = z.infer<typeof createPatientVitalSignSchema>;
export type UpdatePatientVitalSignInput = z.infer<typeof updatePatientVitalSignSchema>;
export type CreatePatientVitalSignData = CreatePatientVitalSignInput & {
  tenantId: string;
  patientId: number;
  recordedByUserId: string;
  bmi?: number;
};
export type UpdatePatientVitalSignData = UpdatePatientVitalSignInput & {
  tenantId: string;
  bmi?: number;
};

export type PatientVitalSign = {
  id: number;
  tenantId: string;
  patientId: number;
  visitId: number | null;
  admissionId: number | null;
  recordedAt: Date;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  systolic: number | null;
  diastolic: number | null;
  pulseBpm: number | null;
  respRate: number | null;
  temperatureC: number | null;
  spo2: number | null;
  painScore: number | null;
  notes: string | null;
  recordedByUserId: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type PatientVitalSignListParams = {
  tenantId: string;
  patientId: number;
  page?: number;
  limit?: number;
};

export function computeBmi(heightCm?: number, weightKg?: number): number | undefined {
  if (heightCm === undefined || weightKg === undefined || heightCm <= 0) {
    return undefined;
  }

  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}
