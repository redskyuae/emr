import { z } from 'zod';

export const ADMISSION_STATUSES = ['ADMITTED', 'DISCHARGED', 'CANCELLED'] as const;

export const DISCHARGE_DISPOSITIONS = [
  'ROUTINE',
  'LAMA',
  'TRANSFERRED',
  'DECEASED',
  'ABSCONDED',
] as const;

export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];
export type DischargeDisposition = (typeof DISCHARGE_DISPOSITIONS)[number];

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const positiveIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be positive`);

function toIsoDate(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return `${yearText}-${monthText}-${dayText}`;
}

export function formatAdmissionDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

// Expected Discharge Date is informational (glossary): optional at admit time
// and editable while the Admission is active.
const expectedDischargeDateSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value, context) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const isoDate = toIsoDate(value);

    if (!isoDate) {
      context.addIssue({
        code: 'custom',
        message: 'Expected discharge date must be in DD-MM-YYYY format',
      });
      return z.NEVER;
    }

    return isoDate;
  });

const admissionReasonSchema = z
  .string()
  .trim()
  .max(500, 'Admission reason must be at most 500 characters')
  .optional()
  .nullable()
  .transform((value) => (value === null || value === '' ? undefined : value));

const remarksSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === null || value === '' ? undefined : value));

export const admissionIdSchema = positiveIdSchema('Admission ID');
export const admissionTenantIdSchema = tenantIdSchema;

export const admitPatientSchema = z.object({
  patientId: positiveIdSchema('Patient ID'),
  doctorId: positiveIdSchema('Doctor ID'),
  admissionTypeId: positiveIdSchema('Admission type ID'),
  bedId: positiveIdSchema('Bed ID'),
  visitId: positiveIdSchema('Visit ID').optional(),
  admissionReason: admissionReasonSchema,
  remarks: remarksSchema,
  expectedDischargeDate: expectedDischargeDateSchema,
});

export const updateAdmissionSchema = z.object({
  admissionReason: admissionReasonSchema,
  remarks: remarksSchema,
  expectedDischargeDate: expectedDischargeDateSchema,
});

export const transferBedSchema = z.object({
  toBedId: positiveIdSchema('Bed ID'),
  reason: z
    .string()
    .trim()
    .max(255, 'Transfer reason must be at most 255 characters')
    .optional()
    .nullable()
    .transform((value) => (value === null || value === '' ? undefined : value)),
});

export const dischargeAdmissionSchema = z.object({
  dischargeDisposition: z.enum(DISCHARGE_DISPOSITIONS, {
    error: 'Discharge disposition is Invalid.',
  }),
  dischargeSummary: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value === null || value === '' ? undefined : value)),
});

export const cancelAdmissionSchema = z.object({
  cancellationReason: z
    .string({ error: 'Cancellation reason is required' })
    .trim()
    .min(1, 'Cancellation reason cannot be empty')
    .max(255, 'Cancellation reason must be at most 255 characters'),
});

export const listAdmissionsSchema = z.object({
  status: z.enum(ADMISSION_STATUSES, { error: 'Status is Invalid.' }).optional(),
  wardId: positiveIdSchema('Ward ID').optional(),
  doctorId: positiveIdSchema('Doctor ID').optional(),
  patientId: positiveIdSchema('Patient ID').optional(),
  query: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type AdmitPatientInput = z.infer<typeof admitPatientSchema>;
export type TransferBedInput = z.infer<typeof transferBedSchema>;
export type UpdateAdmissionInput = z.infer<typeof updateAdmissionSchema>;
export type CancelAdmissionInput = z.infer<typeof cancelAdmissionSchema>;
export type ListAdmissionsInput = z.infer<typeof listAdmissionsSchema>;
export type DischargeAdmissionInput = z.infer<typeof dischargeAdmissionSchema>;

export type ValidatedAdmitPatientData = {
  tenantId: string;
  patientId: number;
  doctorId: number;
  admissionTypeId: number;
  bedId: number;
  // Carried for conflict messages only — never persisted on the Admission.
  bedNumber: string;
  visitId?: number;
  remarks?: string;
  admissionReason?: string;
  expectedDischargeDate?: string;
};

export type AdmissionListParams = ListAdmissionsInput & { tenantId: string };

export type AdmissionPatientSummary = {
  id: number;
  mrn: string;
  phone: string;
  lastName: string;
  firstName: string;
};

export type AdmissionDoctorSummary = {
  id: number;
  name: string;
};

export type AdmissionTypeSummary = {
  id: number;
  name: string;
  code: string;
};

export type AdmissionBedSummary = {
  id: number;
  bedNumber: string;
};

export type AdmissionWardSummary = {
  id: number;
  name: string;
  code: string;
};

export type AdmissionVisitSummary = {
  id: number;
  visitNumber: string;
};

export type Admission = {
  id: number;
  tenantId: string;
  admissionNumber: string;
  status: AdmissionStatus;
  admissionReason: string | null;
  remarks: string | null;
  expectedDischargeDate: string | null;
  admittedAt: Date;
  dischargedAt: Date | null;
  dischargeDisposition: DischargeDisposition | null;
  dischargeSummary: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdOn: Date;
  modifiedOn: Date;
  patient: AdmissionPatientSummary;
  doctor: AdmissionDoctorSummary;
  admissionType: AdmissionTypeSummary;
  bed: AdmissionBedSummary;
  ward: AdmissionWardSummary;
  visit: AdmissionVisitSummary | null;
};

export type AdmissionBedTransferEntry = {
  id: number;
  reason: string | null;
  transferredAt: Date;
  fromBed: AdmissionBedSummary;
  toBed: AdmissionBedSummary;
};

export type AdmissionDetail = Admission & {
  transfers: AdmissionBedTransferEntry[];
};
