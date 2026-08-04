import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentCancelledReasonNameSchema = z
  .string({ error: 'Appointment cancelled reason name is required' })
  .trim()
  .min(1, 'Appointment cancelled reason name cannot be empty')
  .max(100, 'Appointment cancelled reason name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Appointment cancelled reason name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const appointmentCancelledReasonCodeSchema = z
  .string({ error: 'Appointment cancelled reason code is required' })
  .trim()
  .min(1, 'Appointment cancelled reason code cannot be empty')
  .max(10, 'Appointment cancelled reason code must be at most 10 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Appointment cancelled reason code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const appointmentCancelledReasonDescriptionSchema = z
  .union([
    z
      .string()
      .trim()
      .max(500, 'Appointment cancelled reason description must be at most 500 characters'),
    z.null(),
  ])
  .transform((value) => {
    if (value === null) {
      return undefined;
    }

    return value === '' ? undefined : value;
  })
  .optional();

export const appointmentCancelledReasonIdSchema = z.coerce
  .number({ error: 'Appointment cancelled reason ID is required' })
  .int('Appointment cancelled reason ID must be an integer')
  .positive('Appointment cancelled reason ID must be positive');

export const appointmentCancelledReasonTenantIdSchema = tenantIdSchema;

export const createAppointmentCancelledReasonSchema = z.object({
  name: appointmentCancelledReasonNameSchema,
  code: appointmentCancelledReasonCodeSchema,
  description: appointmentCancelledReasonDescriptionSchema,
});

export const updateAppointmentCancelledReasonSchema = createAppointmentCancelledReasonSchema;

export type AppointmentCancelledReasonIdInput = z.infer<typeof appointmentCancelledReasonIdSchema>;
export type AppointmentCancelledReasonTenantIdInput = z.infer<
  typeof appointmentCancelledReasonTenantIdSchema
>;
export type CreateAppointmentCancelledReasonInput = z.infer<
  typeof createAppointmentCancelledReasonSchema
>;
export type UpdateAppointmentCancelledReasonInput = z.infer<
  typeof updateAppointmentCancelledReasonSchema
>;
export type CreateAppointmentCancelledReasonData = CreateAppointmentCancelledReasonInput & {
  tenantId: string;
};
export type UpdateAppointmentCancelledReasonData = UpdateAppointmentCancelledReasonInput & {
  tenantId: string;
};

export type AppointmentCancelledReason = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AppointmentCancelledReasonListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
