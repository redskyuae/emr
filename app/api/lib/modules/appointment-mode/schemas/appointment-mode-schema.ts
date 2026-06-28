import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentModeNameSchema = z
  .string({ error: 'Appointment mode name is required' })
  .trim()
  .min(1, 'Appointment mode name cannot be empty')
  .max(100, 'Appointment mode name must be at most 100 characters');

const appointmentModeCodeSchema = z
  .string({ error: 'Appointment mode code is required' })
  .trim()
  .min(1, 'Appointment mode code cannot be empty')
  .max(10, 'Appointment mode code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const appointmentModeDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

export const appointmentModeIdSchema = z.coerce
  .number({ error: 'Appointment mode ID is required' })
  .int('Appointment mode ID must be an integer')
  .positive('Appointment mode ID must be positive');

export const appointmentModeTenantIdSchema = tenantIdSchema;

export const createAppointmentModeSchema = z.object({
  name: appointmentModeNameSchema,
  code: appointmentModeCodeSchema,
  description: appointmentModeDescriptionSchema,
});

export const updateAppointmentModeSchema = createAppointmentModeSchema;

export type AppointmentModeIdInput = z.infer<typeof appointmentModeIdSchema>;
export type AppointmentModeTenantIdInput = z.infer<typeof appointmentModeTenantIdSchema>;
export type CreateAppointmentModeInput = z.infer<typeof createAppointmentModeSchema>;
export type UpdateAppointmentModeInput = z.infer<typeof updateAppointmentModeSchema>;
export type CreateAppointmentModeData = CreateAppointmentModeInput & { tenantId: string };
export type UpdateAppointmentModeData = UpdateAppointmentModeInput & { tenantId: string };

export type AppointmentMode = {
  id: number;
  name: string;
  code: string;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
};

export type AppointmentModeListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
};
