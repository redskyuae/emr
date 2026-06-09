import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentStatusNameSchema = z
  .string({ error: 'Appointment status name is required' })
  .trim()
  .min(1, 'Appointment status name cannot be empty')
  .max(100, 'Appointment status name must be at most 100 characters');

const appointmentStatusCodeSchema = z
  .string({ error: 'Appointment status code is required' })
  .trim()
  .min(1, 'Appointment status code cannot be empty')
  .max(10, 'Appointment status code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const appointmentStatusDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

export const appointmentStatusIdSchema = z.coerce
  .number({ error: 'Appointment status ID is required' })
  .int('Appointment status ID must be an integer')
  .positive('Appointment status ID must be positive');

export const appointmentStatusTenantIdSchema = tenantIdSchema;

export const createAppointmentStatusSchema = z.object({
  tenantId: tenantIdSchema,
  name: appointmentStatusNameSchema,
  code: appointmentStatusCodeSchema,
  description: appointmentStatusDescriptionSchema,
});

export const updateAppointmentStatusSchema = createAppointmentStatusSchema;

export type AppointmentStatusIdInput = z.infer<typeof appointmentStatusIdSchema>;
export type AppointmentStatusTenantIdInput = z.infer<typeof appointmentStatusTenantIdSchema>;
export type CreateAppointmentStatusInput = z.infer<typeof createAppointmentStatusSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export type AppointmentStatus = {
  id: number;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  createdOn: Date;
  modifiedOn: Date;
};

export type AppointmentStatusListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
