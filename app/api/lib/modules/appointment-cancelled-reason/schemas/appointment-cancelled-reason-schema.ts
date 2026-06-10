import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentCancelledReasonNameSchema = z
  .string({ error: 'Appointment cancelled reason name is required' })
  .trim()
  .min(1, 'Appointment cancelled reason name cannot be empty')
  .max(100, 'Appointment cancelled reason name must be at most 100 characters');

const appointmentCancelledReasonCodeSchema = z
  .string({ error: 'Appointment cancelled reason code is required' })
  .trim()
  .min(1, 'Appointment cancelled reason code cannot be empty')
  .max(10, 'Appointment cancelled reason code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const appointmentCancelledReasonDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((description) => {
    if (description === null || description === '') {
      return undefined;
    }

    return description;
  });

export const appointmentCancelledReasonIdSchema = z.coerce
  .number({ error: 'Appointment cancelled reason ID is required' })
  .int('Appointment cancelled reason ID must be an integer')
  .positive('Appointment cancelled reason ID must be positive');

export const appointmentCancelledReasonTenantIdSchema = tenantIdSchema;

export const createAppointmentCancelledReasonSchema = z.object({
  tenantId: tenantIdSchema,
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

export type AppointmentCancelledReason = {
  id: number;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  createdOn: Date;
  modifiedOn: Date;
};

export type AppointmentCancelledReasonListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
