import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const rotaTypes = ['new', 'remove'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

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

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatSlotDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

const dateOnlySchema = (fieldName: string) =>
  z
    .string({ error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`)
    .refine(isValidDateOnly, `${fieldName} must be a valid date`);

const positiveIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be positive`);

const rotaIdsSchema = z
  .array(positiveIdSchema('Doctor rota ID'), { error: 'Doctor rota is required' })
  .min(1, 'Doctor rota is required');

const slotDurationSchema = z.unknown().transform((value, context) => {
  if (value === undefined || value === null || value === '') {
    context.addIssue({ code: 'custom', message: 'Slot duration is required' });
    return z.NEVER;
  }

  let duration: number;

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') {
      context.addIssue({ code: 'custom', message: 'Slot duration is required' });
      return z.NEVER;
    }

    if (timePattern.test(trimmed)) {
      duration = minutesFromTime(trimmed);
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

const optionalSlotDurationSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  return value;
}, slotDurationSchema.optional());

const createDoctorScheduleRawSchema = z
  .object({
    doctorId: positiveIdSchema('Doctor ID').optional(),
    facilityId: positiveIdSchema('Facility ID').optional(),
    clinicianLicenseId: positiveIdSchema('Doctor ID').optional(),
    rotaIds: rotaIdsSchema,
    slotInMinute: slotDurationSchema,
    slotToDate: dateOnlySchema('Slot to date'),
    slotFromDate: dateOnlySchema('Slot from date'),
    rotaType: z.enum(rotaTypes, { error: 'Rota type is invalid' }).optional(),
  })
  .strict()
  .refine((data) => data.doctorId !== undefined || data.clinicianLicenseId !== undefined, {
    path: ['doctorId'],
    message: 'Doctor ID is required',
  })
  .refine((data) => data.slotToDate >= data.slotFromDate, {
    path: ['slotToDate'],
    message: 'Slot to date must be on or after slot from date',
  });

const updateDoctorScheduleRawSchema = z
  .object({
    doctorId: positiveIdSchema('Doctor ID').optional(),
    facilityId: positiveIdSchema('Facility ID').optional(),
    rotaIds: rotaIdsSchema.optional(),
    rotaType: z.enum(rotaTypes, { error: 'Rota type is invalid' }).optional(),
    slotToDate: dateOnlySchema('Slot to date').optional(),
    slotFromDate: dateOnlySchema('Slot from date').optional(),
    slotInMinute: optionalSlotDurationSchema,
    doctorScheduleId: positiveIdSchema('Doctor schedule ID').optional(),
    clinicianLicenseId: positiveIdSchema('Doctor ID').optional(),
    clinicianScheduleId: positiveIdSchema('Doctor schedule ID').optional(),
  })
  .strict()
  .refine((data) => data.doctorScheduleId !== undefined || data.clinicianScheduleId !== undefined, {
    path: ['doctorScheduleId'],
    message: 'Doctor schedule ID is required',
  })
  .refine(
    (data) =>
      [
        data.doctorId,
        data.rotaIds,
        data.rotaType,
        data.slotToDate,
        data.slotFromDate,
        data.slotInMinute,
        data.clinicianLicenseId,
      ].some((value) => value !== undefined),
    {
      message: 'At least one Doctor schedule field is required',
    }
  )
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

export const doctorScheduleIdSchema = positiveIdSchema('Doctor schedule ID');
export const doctorScheduleDoctorIdSchema = positiveIdSchema('Doctor ID');
export const doctorScheduleTenantIdSchema = tenantIdSchema;

export const createDoctorScheduleSchema = createDoctorScheduleRawSchema.transform((data) => ({
  doctorId: data.doctorId ?? data.clinicianLicenseId ?? 0,
  rotaIds: data.rotaIds,
  slotToDate: data.slotToDate,
  slotFromDate: data.slotFromDate,
  slotDurationMinutes: data.slotInMinute,
}));

export const updateDoctorScheduleSchema = updateDoctorScheduleRawSchema.transform((data) => ({
  id: data.doctorScheduleId ?? data.clinicianScheduleId ?? 0,
  payload: {
    doctorId: data.doctorId ?? data.clinicianLicenseId,
    rotaIds: data.rotaIds,
    rotaType: data.rotaType,
    slotToDate: data.slotToDate,
    slotFromDate: data.slotFromDate,
    slotDurationMinutes: data.slotInMinute,
  },
}));

export const doctorScheduleListParamsSchema = z
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
    doctorId: positiveIdSchema('Doctor ID').optional(),
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

export const doctorSlotsParamsSchema = z
  .object({
    tenantId: tenantIdSchema,
    doctorId: positiveIdSchema('Doctor ID'),
    slotDate: dateOnlySchema('Slot date'),
  })
  .strict();

export type DoctorScheduleIdInput = z.infer<typeof doctorScheduleIdSchema>;
export type DoctorScheduleTenantIdInput = z.infer<typeof doctorScheduleTenantIdSchema>;
export type CreateDoctorScheduleInput = z.infer<typeof createDoctorScheduleSchema>;
export type UpdateDoctorSchedulePayload = {
  doctorId?: number;
  rotaIds?: number[];
  rotaType?: (typeof rotaTypes)[number];
  slotToDate?: string;
  slotFromDate?: string;
  slotDurationMinutes?: number;
};
export type UpdateDoctorScheduleInput = {
  id: number;
  payload: UpdateDoctorSchedulePayload;
};
export type DoctorScheduleListParams = z.infer<typeof doctorScheduleListParamsSchema>;
export type DoctorSlotsParams = z.infer<typeof doctorSlotsParamsSchema>;

export type DoctorScheduleRotaDetail = {
  rotaId: number;
  rotaName: string;
  rotaTime: string;
  toTime: string;
  fromTime: string;
};

export type DoctorSchedule = {
  id: number;
  tenantId: string;
  doctorId: number;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
  slotToDate: string;
  slotInMinute: string;
  slotFromDate: string;
  rotaDetails: DoctorScheduleRotaDetail[];
  slotDurationMinutes: number;
};

export type DoctorSlotRota = {
  duration: number;
  rotaName: string;
  doctorRotaId: number;
  slots: {
    slot: number;
    slotTime: string;
    slotStatus: 'Available';
  }[];
};

export type DoctorSlotDate = {
  slotDate: string;
  status: 'Available';
  rotas: DoctorSlotRota[];
};

export type CreateDoctorScheduleData = CreateDoctorScheduleInput & { tenantId: string };
export type UpdateDoctorScheduleData = UpdateDoctorSchedulePayload & { tenantId: string };

export { formatSlotDuration, minutesFromTime };
