import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const rotaTypes = ['new', 'remove'] as const;

function formatSlotDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const positiveIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be positive`);

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const dateOnlySchema = (fieldName: string) =>
  z
    .string({ error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`)
    .refine(isValidDateOnly, `${fieldName} must be a valid date`);

const rotaIdsSchema = z
  .array(positiveIdSchema('Rota ID'), { error: 'Rota is required' })
  .min(1, 'Rota is required')
  .refine((ids) => new Set(ids).size === ids.length, 'Rota IDs must be unique');

const slotDurationSchema = z.unknown().transform((value, context) => {
  if (value === undefined || value === null || value === '') {
    context.addIssue({ code: 'custom', message: 'Slot duration is required' });
    return z.NEVER;
  }

  let duration: number;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (timePattern.test(trimmed)) {
      const [hours, minutes] = trimmed.split(':').map(Number);
      duration = hours * 60 + minutes;
    } else if (/^\d+$/.test(trimmed)) {
      duration = Number(trimmed);
    } else {
      context.addIssue({ code: 'custom', message: 'Slot duration must be in HH:mm format' });
      return z.NEVER;
    }
  } else {
    duration = Number(value);
  }

  if (!Number.isInteger(duration)) {
    context.addIssue({ code: 'custom', message: 'Slot duration must be an integer' });
    return z.NEVER;
  }
  if (duration <= 0) {
    context.addIssue({ code: 'custom', message: 'Slot duration must be positive' });
    return z.NEVER;
  }
  if (duration > 1440) {
    context.addIssue({ code: 'custom', message: 'Slot duration must be at most 1440 minutes' });
    return z.NEVER;
  }
  return duration;
});

const createRawSchema = z
  .object({
    therapistId: positiveIdSchema('Therapist ID'),
    rotaIds: rotaIdsSchema,
    slotInMinute: slotDurationSchema,
    slotToDate: dateOnlySchema('Slot to date'),
    slotFromDate: dateOnlySchema('Slot from date'),
  })
  .strict()
  .refine((data) => data.slotToDate >= data.slotFromDate, {
    path: ['slotToDate'],
    message: 'Slot to date must be on or after slot from date',
  });

const updateRawSchema = z
  .object({
    rotaIds: rotaIdsSchema.optional(),
    rotaType: z.enum(rotaTypes, { error: 'Rota type is invalid' }).optional(),
    therapistId: positiveIdSchema('Therapist ID').optional(),
    slotToDate: dateOnlySchema('Slot to date').optional(),
    slotFromDate: dateOnlySchema('Slot from date').optional(),
    slotInMinute: slotDurationSchema.optional(),
    therapistScheduleId: positiveIdSchema('Therapist schedule ID'),
  })
  .strict()
  .refine(
    (data) =>
      [data.rotaIds, data.therapistId, data.slotToDate, data.slotFromDate, data.slotInMinute].some(
        (value) => value !== undefined
      ),
    { message: 'At least one Therapist schedule field is required' }
  )
  .refine((data) => data.rotaType === undefined || data.rotaIds !== undefined, {
    path: ['rotaIds'],
    message: 'Rota is required when rota type is provided',
  })
  .refine(
    (data) =>
      data.slotFromDate === undefined ||
      data.slotToDate === undefined ||
      data.slotToDate >= data.slotFromDate,
    {
      path: ['slotToDate'],
      message: 'Slot to date must be on or after slot from date',
    }
  );

export const therapistScheduleIdSchema = positiveIdSchema('Therapist schedule ID');
export const therapistScheduleTenantIdSchema = tenantIdSchema;

export const createTherapistScheduleSchema = createRawSchema.transform((data) => ({
  rotaIds: data.rotaIds,
  therapistId: data.therapistId,
  slotToDate: data.slotToDate,
  slotFromDate: data.slotFromDate,
  slotDurationMinutes: data.slotInMinute,
}));

export const updateTherapistScheduleSchema = updateRawSchema.transform((data) => ({
  id: data.therapistScheduleId,
  payload: {
    rotaIds: data.rotaIds,
    rotaType: data.rotaType,
    therapistId: data.therapistId,
    slotToDate: data.slotToDate,
    slotFromDate: data.slotFromDate,
    slotDurationMinutes: data.slotInMinute,
  },
}));

export const therapistScheduleListParamsSchema = z
  .object({
    page: z.coerce
      .number()
      .int('Page must be an integer')
      .positive('Page must be positive')
      .optional(),
    limit: z.coerce
      .number()
      .int('Limit must be an integer')
      .positive('Limit must be positive')
      .max(999, 'Limit must be at most 999')
      .optional(),
    tenantId: tenantIdSchema,
    therapistId: positiveIdSchema('Therapist ID').optional(),
    toDate: dateOnlySchema('To date').optional(),
    fromDate: dateOnlySchema('From date').optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.fromDate === undefined || data.toDate === undefined || data.toDate >= data.fromDate,
    {
      path: ['toDate'],
      message: 'To date must be on or after from date',
    }
  );

export type TherapistScheduleListParams = z.infer<typeof therapistScheduleListParamsSchema>;
export type CreateTherapistScheduleInput = z.infer<typeof createTherapistScheduleSchema>;
export type UpdateTherapistScheduleInput = z.infer<typeof updateTherapistScheduleSchema>;

export type TherapistScheduleRotaDetail = {
  rotaId: number;
  rotaName: string;
  rotaTime: string;
  toTime: string;
  fromTime: string;
};

export type TherapistSchedule = {
  id: number;
  tenantId: string;
  therapistId: number;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
  slotToDate: string;
  slotInMinute: string;
  slotFromDate: string;
  rotaDetails: TherapistScheduleRotaDetail[];
  slotDurationMinutes: number;
};

export type UpdateTherapistSchedulePayload = {
  rotaIds?: number[];
  rotaType?: (typeof rotaTypes)[number];
  therapistId?: number;
  slotToDate?: string;
  slotFromDate?: string;
  slotDurationMinutes?: number;
};

export type CreateTherapistScheduleData = CreateTherapistScheduleInput & { tenantId: string };
export type UpdateTherapistScheduleData = UpdateTherapistSchedulePayload & { tenantId: string };

export { formatSlotDuration };
