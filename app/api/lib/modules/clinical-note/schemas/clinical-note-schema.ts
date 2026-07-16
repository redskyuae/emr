import { z } from 'zod';

const CLINICAL_NOTE_STATUSES = ['draft', 'signed'] as const;
const SOAP_KEYS = ['subjective', 'objective', 'assessment', 'plan'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalSoap = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value;
      }
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    },
    z.string().max(20000, `Clinical note ${label} must be at most 20000 characters`).optional()
  );

const requiredNoteTypeId = z.coerce
  .number({ error: 'Clinical note type ID is required' })
  .int('Clinical note type ID must be an integer')
  .positive('Clinical note type ID must be positive');

const optionalVisitId = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z.coerce
    .number({ error: 'Clinical note visit ID must be a number' })
    .int('Clinical note visit ID must be an integer')
    .positive('Clinical note visit ID must be positive')
    .optional()
);

export const clinicalNoteIdSchema = z.coerce
  .number({ error: 'Clinical note ID is required' })
  .int('Clinical note ID must be an integer')
  .positive('Clinical note ID must be positive');

export const clinicalNoteTenantIdSchema = tenantIdSchema;

export const clinicalNotePayloadSchema = z
  .object({
    noteTypeId: requiredNoteTypeId,
    visitId: optionalVisitId,
    subjective: optionalSoap('subjective'),
    objective: optionalSoap('objective'),
    assessment: optionalSoap('assessment'),
    plan: optionalSoap('plan'),
  })
  .refine((data) => SOAP_KEYS.some((key) => data[key] !== undefined), {
    message: 'At least one clinical note section is required',
    path: ['subjective'],
  });

export const createClinicalNoteSchema = clinicalNotePayloadSchema;
export const updateClinicalNoteSchema = clinicalNotePayloadSchema;

export type ClinicalNoteStatus = (typeof CLINICAL_NOTE_STATUSES)[number];
export type ClinicalNoteIdInput = z.infer<typeof clinicalNoteIdSchema>;
export type CreateClinicalNoteInput = z.infer<typeof createClinicalNoteSchema>;
export type UpdateClinicalNoteInput = z.infer<typeof updateClinicalNoteSchema>;

export type CreateClinicalNoteData = CreateClinicalNoteInput & {
  tenantId: string;
  patientId: number;
  authorUserId: string;
  recordedByUserId: string;
};
export type UpdateClinicalNoteData = UpdateClinicalNoteInput & {
  tenantId: string;
};

export type ClinicalNote = {
  id: number;
  tenantId: string;
  patientId: number;
  visitId: number | null;
  noteTypeId: number;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  status: ClinicalNoteStatus;
  signedAt: Date | null;
  authorUserId: string;
  recordedByUserId: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type ClinicalNoteListParams = {
  tenantId: string;
  patientId: number;
  page?: number;
  limit?: number;
};
