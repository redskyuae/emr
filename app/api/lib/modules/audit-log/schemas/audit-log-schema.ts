import { z } from 'zod';

import {
  AUDIT_ACTION_KEYS,
  AUDIT_CATEGORIES,
  AUDIT_ENTITY_TYPES,
  AUDIT_MODULES,
  AUDIT_OPERATIONS,
  type AuditAction,
  type AuditCategory,
  type AuditEntityType,
  type AuditModule,
  type AuditOperation,
} from './audit-action-catalogue';

/** Whether the action happened; only sign-in attempts record a failure today. */
export const AUDIT_OUTCOMES = ['success', 'failed'] as const;

// An export larger than this is refused so a single request cannot pull an
// unbounded slice of the trail; the caller narrows the filters instead.
export const AUDIT_EXPORT_MAX_ROWS = 50_000;

// A PDF lays every event out on paper, so it holds far fewer than a CSV: about
// 400 pages at most. A larger selection is refused with a hint to use CSV.
export const AUDIT_PDF_EXPORT_MAX_ROWS = 5_000;

/** The file formats the Audit Log and User Audit exports offer; CSV when none is given. */
export const AUDIT_EXPORT_FORMATS = ['csv', 'pdf'] as const;

export type AuditExportFormat = (typeof AUDIT_EXPORT_FORMATS)[number];

export const auditExportFormatSchema = z
  .enum(AUDIT_EXPORT_FORMATS, { error: 'Format must be csv or pdf' })
  .default('csv');

// A field value longer than this is cut in `changes`, so one amended note cannot
// grow an Audit Event without bound.
export const AUDIT_CHANGE_VALUE_MAX_LENGTH = 10_000;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const positiveIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be positive`);

const optionalText = (fieldName: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${fieldName} must be at most ${max} characters`)
    .transform((value) => value || null)
    .nullish();

const isoDateSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${fieldName} must be a date in YYYY-MM-DD format`)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
      message: `${fieldName} is Invalid.`,
    });

const changeValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const auditChangeSchema = z.object({
  field: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(100),
  from: changeValueSchema,
  to: changeValueSchema,
});

export type AuditChange = z.infer<typeof auditChangeSchema>;

export const auditTenantIdSchema = tenantIdSchema;

/**
 * The internal shape a route hands to the recorder. It never comes from a request
 * body: the actor and request context are resolved from the Session and headers.
 */
export const recordAuditEventSchema = z.object({
  tenantId: tenantIdSchema,
  action: z.enum(AUDIT_ACTION_KEYS, { error: 'Audit action is Invalid.' }),
  actorUserId: z.string().trim().min(1).max(255).nullable(),
  actorName: z.string().trim().min(1, 'Actor name is required').max(255),
  actorEmail: optionalText('Actor email', 320),
  actorRoles: optionalText('Actor roles', 500),
  sessionId: optionalText('Session ID', 255),
  outcome: z.enum(AUDIT_OUTCOMES, { error: 'Outcome is Invalid.' }).default('success'),
  entityId: z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim() || null)
    .nullish(),
  entityLabel: optionalText('Entity label', 255),
  patientId: positiveIdSchema('Patient ID').nullish(),
  visitId: positiveIdSchema('Visit ID').nullish(),
  reason: optionalText('Reason', 2000),
  changes: z.array(auditChangeSchema).max(200).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  ipAddress: optionalText('IP address', 64),
  userAgent: optionalText('User agent', 1000),
});

export type RecordAuditEventInput = z.input<typeof recordAuditEventSchema>;

export type ValidatedAuditEvent = Omit<z.output<typeof recordAuditEventSchema>, 'outcome'> & {
  outcome?: (typeof AUDIT_OUTCOMES)[number];
  category: AuditCategory;
  entityType: AuditEntityType;
};

const auditFilterShape = {
  toDate: isoDateSchema('To date').optional(),
  fromDate: isoDateSchema('From date').optional(),
  action: z.enum(AUDIT_ACTION_KEYS, { error: 'Audit action is Invalid.' }).optional(),
  visitId: positiveIdSchema('Visit ID').optional(),
  category: z.enum(AUDIT_CATEGORIES, { error: 'Audit category is Invalid.' }).optional(),
  module: z.enum(AUDIT_MODULES, { error: 'Module is Invalid.' }).optional(),
  operation: z.enum(AUDIT_OPERATIONS, { error: 'Operation is Invalid.' }).optional(),
  patientId: positiveIdSchema('Patient ID').optional(),
  entityId: z.string().trim().min(1).max(100).optional(),
  entityType: z.enum(AUDIT_ENTITY_TYPES, { error: 'Entity type is Invalid.' }).optional(),
  actorUserId: z.string().trim().min(1).max(255).optional(),
  sessionId: z.string().trim().min(1).max(255).optional(),
  query: z.string().trim().max(100, 'Search must be at most 100 characters').optional(),
};

/** The query-string names both Audit Log routes accept as filters. */
export const AUDIT_FILTER_NAMES = Object.keys(
  auditFilterShape
) as (keyof typeof auditFilterShape)[];

function fromBeforeTo(filters: { fromDate?: string; toDate?: string }) {
  return !filters.fromDate || !filters.toDate || filters.fromDate <= filters.toDate;
}

const rangeError = { message: 'From date must be on or before To date', path: ['toDate'] };

export const auditEventFiltersSchema = z.object(auditFilterShape).refine(fromBeforeTo, rangeError);

export const exportAuditEventsSchema = z
  .object({ ...auditFilterShape, format: auditExportFormatSchema })
  .refine(fromBeforeTo, rangeError);

export const listAuditEventsSchema = z
  .object({
    ...auditFilterShape,
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100, 'Limit must be at most 100').optional(),
  })
  .refine(fromBeforeTo, rangeError);

export type AuditEventFilters = z.infer<typeof auditEventFiltersSchema>;

export type AuditEventListParams = z.infer<typeof listAuditEventsSchema> & {
  tenantId: string;
  // The Tenant's IANA time zone, which turns the From/To dates into instants.
  timeZone: string;
};

export type AuditEventPatientSummary = {
  id: number;
  mrn: string;
  lastName: string;
  firstName: string;
};

export type AuditEvent = {
  id: number;
  tenantId: string;
  occurredOn: Date;
  actorUserId: string | null;
  actorName: string;
  actorEmail: string | null;
  actorRoles: string | null;
  sessionId: string | null;
  action: AuditAction;
  module: AuditModule;
  operation: AuditOperation;
  category: AuditCategory;
  outcome: string;
  entityType: AuditEntityType;
  entityId: string | null;
  entityLabel: string | null;
  patientId: number | null;
  visitId: number | null;
  reason: string | null;
  changes: AuditChange[] | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
};

/** An Audit Event as the Audit Log lists it, with the Patient it concerns. */
export type AuditEventListItem = AuditEvent & { patient: AuditEventPatientSummary | null };
