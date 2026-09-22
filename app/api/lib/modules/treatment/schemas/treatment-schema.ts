import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const treatmentNameSchema = z
  .string({ error: 'Treatment name is required' })
  .trim()
  .min(1, 'Treatment name cannot be empty')
  .max(200, 'Treatment name must be at most 200 characters')
  .regex(
    /^(?=.*\p{L})[\p{L}\p{N} +,&'()/_.:;{}[\]-]+$/u,
    'Treatment name must contain only letters, numbers, spaces, and common punctuation used in protocol names.'
  );

const treatmentCodeSchema = z
  .string({ error: 'Treatment code is required' })
  .trim()
  .min(1, 'Treatment code cannot be empty')
  .max(20, 'Treatment code must be at most 20 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Treatment code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const optionalTextSchema = (fieldName: string, maxLength: number) =>
  z
    .union([
      z.string().trim().max(maxLength, `${fieldName} must be at most ${maxLength} characters`),
      z.null(),
    ])
    .transform((value) => {
      if (value === null) {
        return undefined;
      }

      return value === '' ? undefined : value;
    })
    .optional();

const minutesSchema = (fieldName: string, { min = 0 }: { min?: number } = {}) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .min(min, `${fieldName} must be at least ${min}`)
    .max(480, `${fieldName} must be at most 480`);

const optionalNameSchema = (fieldName: string) =>
  z
    .union([z.string().trim().max(100, `${fieldName} must be at most 100 characters`), z.null()])
    .transform((value) => {
      if (value === null) {
        return undefined;
      }

      return value === '' ? undefined : value;
    })
    .optional();

const treatmentSessionInputSchema = z.object({
  label: z
    .string({ error: 'Session label is required' })
    .trim()
    .min(1, 'Session label cannot be empty')
    .max(200, 'Session label must be at most 200 characters'),
  procedure: z
    .string({ error: 'Session procedure is required' })
    .trim()
    .min(1, 'Session procedure cannot be empty')
    .max(200, 'Session procedure must be at most 200 characters'),
  sessionNumber: z.coerce
    .number({ error: 'Session number is required' })
    .int('Session number must be an integer')
    .positive('Session number must be positive'),
  durationMinutes: minutesSchema('Session duration', { min: 1 }),
  setupMinutes: minutesSchema('Session setup minutes').default(0),
  cleaningMinutes: minutesSchema('Session cleaning minutes').default(0),
  preparation: optionalTextSchema('Session preparation', 1000),
  warning: optionalTextSchema('Session warning', 1000),
  equipment: optionalTextSchema('Session equipment', 500),
  roomType: optionalNameSchema('Session room type'),
  therapistSkill: optionalNameSchema('Session therapist skill'),
  therapistSkillId: z.coerce.number().int().positive().optional(),
});

export const treatmentIdSchema = z.coerce
  .number({ error: 'Treatment ID is required' })
  .int('Treatment ID must be an integer')
  .positive('Treatment ID must be positive');

export const treatmentSessionIdSchema = z.coerce
  .number({ error: 'Treatment session ID is required' })
  .int('Treatment session ID must be an integer')
  .positive('Treatment session ID must be positive');

export const treatmentTenantIdSchema = tenantIdSchema;

export const createTreatmentSchema = z
  .object({
    name: treatmentNameSchema,
    code: treatmentCodeSchema,
    description: optionalTextSchema('Treatment description', 500),
    durationMinutes: minutesSchema('Treatment duration', { min: 1 }),
    setupMinutes: minutesSchema('Treatment setup minutes').default(0),
    cleaningMinutes: minutesSchema('Treatment cleaning minutes').default(0),
    roomType: optionalNameSchema('Treatment room type'),
    therapistSkill: optionalNameSchema('Treatment therapist skill'),
    therapistSkillId: z.coerce.number().int().positive().optional(),
    sessions: z
      .array(treatmentSessionInputSchema, { error: 'Sessions are required' })
      .min(1, 'At least one Session is required')
      .refine(
        (sessions) =>
          new Set(sessions.map((session) => session.sessionNumber)).size === sessions.length,
        'Session numbers must be unique'
      ),
  })
  .strict();

export const updateTreatmentSchema = z
  .object({
    name: treatmentNameSchema,
    code: treatmentCodeSchema,
    description: optionalTextSchema('Treatment description', 500),
    durationMinutes: minutesSchema('Treatment duration', { min: 1 }),
    setupMinutes: minutesSchema('Treatment setup minutes').default(0),
    cleaningMinutes: minutesSchema('Treatment cleaning minutes').default(0),
    roomType: optionalNameSchema('Treatment room type'),
    therapistSkill: optionalNameSchema('Treatment therapist skill'),
    therapistSkillId: z.coerce.number().int().positive().optional(),
  })
  .strict();

export type TreatmentIdInput = z.infer<typeof treatmentIdSchema>;
export type TreatmentTenantIdInput = z.infer<typeof treatmentTenantIdSchema>;
export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
export type UpdateTreatmentInput = z.infer<typeof updateTreatmentSchema>;
export type CreateTreatmentData = CreateTreatmentInput & { tenantId: string };
export type UpdateTreatmentData = UpdateTreatmentInput & { tenantId: string };

export type TreatmentSession = {
  id: number;
  label: string;
  procedure: string;
  tenantId: string;
  createdOn: Date;
  treatmentId: number;
  modifiedOn: Date;
  sessionNumber: number;
  durationMinutes: number;
  setupMinutes: number;
  cleaningMinutes: number;
  preparation: string | null;
  warning: string | null;
  equipment: string | null;
  roomType: string | null;
  therapistSkill: string | null;
  therapistSkillId?: number | null;
};

export type Treatment = {
  id: number;
  name: string;
  code: string;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
  durationMinutes: number;
  setupMinutes: number;
  cleaningMinutes: number;
  roomType: string | null;
  therapistSkill: string | null;
  therapistSkillId?: number | null;
  sessions: TreatmentSession[];
};

export type TreatmentListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};

export type TreatmentSummary = {
  id: number;
  name: string;
  code: string;
};

export type TreatmentSessionSummary = {
  id: number;
  label: string;
  procedure: string;
  sessionNumber: number;
  durationMinutes: number;
  setupMinutes: number;
  cleaningMinutes: number;
  roomType: string | null;
  therapistSkill: string | null;
  therapistSkillId?: number | null;
};
