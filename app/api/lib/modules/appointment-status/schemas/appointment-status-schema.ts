import { z } from 'zod';

export const APPOINTMENT_STATUS_CATEGORIES = [
  'SCHEDULED',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

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

const appointmentStatusCategorySchema = z.enum(APPOINTMENT_STATUS_CATEGORIES, {
  error:
    'Appointment status category must be one of SCHEDULED, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, or NO_SHOW.',
});

export const appointmentStatusIdSchema = z.coerce
  .number({ error: 'Appointment status ID is required' })
  .int('Appointment status ID must be an integer')
  .positive('Appointment status ID must be positive');

export const appointmentStatusTenantIdSchema = tenantIdSchema;

export const createAppointmentStatusSchema = z.object({
  name: appointmentStatusNameSchema,
  code: appointmentStatusCodeSchema,
  category: appointmentStatusCategorySchema,
  description: appointmentStatusDescriptionSchema,
});

export const updateAppointmentStatusSchema = createAppointmentStatusSchema;

export type AppointmentStatusIdInput = z.infer<typeof appointmentStatusIdSchema>;
export type AppointmentStatusTenantIdInput = z.infer<typeof appointmentStatusTenantIdSchema>;
export type AppointmentStatusCategory = (typeof APPOINTMENT_STATUS_CATEGORIES)[number];
export type CreateAppointmentStatusInput = z.infer<typeof createAppointmentStatusSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type CreateAppointmentStatusData = CreateAppointmentStatusInput & { tenantId: string };
export type UpdateAppointmentStatusData = UpdateAppointmentStatusInput & { tenantId: string };

export type AppointmentStatus = {
  id: number;
  code: string;
  name: string;
  tenantId: string;
  isSystem: boolean;
  category: AppointmentStatusCategory;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
};

export type AppointmentStatusListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
