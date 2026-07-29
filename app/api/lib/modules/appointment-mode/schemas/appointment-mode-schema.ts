import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentModeNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Appointment mode name',
  maxMessage: 'Appointment mode name must be at most 100 characters',
  emptyMessage: 'Appointment mode name cannot be empty',
  requiredMessage: 'Appointment mode name is required',
});

const appointmentModeCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Appointment mode code',
  maxMessage: 'Appointment mode code must be at most 10 characters',
  emptyMessage: 'Appointment mode code cannot be empty',
  requiredMessage: 'Appointment mode code is required',
});

const appointmentModeDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Appointment mode description must be at most 500 characters',
});

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
