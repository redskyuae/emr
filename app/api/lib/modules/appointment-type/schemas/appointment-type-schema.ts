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

const appointmentTypeNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Appointment type name',
  maxMessage: 'Appointment type name must be at most 100 characters',
  emptyMessage: 'Appointment type name cannot be empty',
  requiredMessage: 'Appointment type name is required',
});

const appointmentTypeCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Appointment type code',
  maxMessage: 'Appointment type code must be at most 10 characters',
  emptyMessage: 'Appointment type code cannot be empty',
  requiredMessage: 'Appointment type code is required',
});

const appointmentTypeDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Appointment type description must be at most 500 characters',
});

export const appointmentTypeIdSchema = z.coerce
  .number({ error: 'Appointment type ID is required' })
  .int('Appointment type ID must be an integer')
  .positive('Appointment type ID must be positive');

export const appointmentTypeTenantIdSchema = tenantIdSchema;

export const createAppointmentTypeSchema = z.object({
  name: appointmentTypeNameSchema,
  code: appointmentTypeCodeSchema,
  description: appointmentTypeDescriptionSchema,
});

export const updateAppointmentTypeSchema = createAppointmentTypeSchema;

export type AppointmentTypeIdInput = z.infer<typeof appointmentTypeIdSchema>;
export type AppointmentTypeTenantIdInput = z.infer<typeof appointmentTypeTenantIdSchema>;
export type CreateAppointmentTypeInput = z.infer<typeof createAppointmentTypeSchema>;
export type UpdateAppointmentTypeInput = z.infer<typeof updateAppointmentTypeSchema>;
export type CreateAppointmentTypeData = CreateAppointmentTypeInput & { tenantId: string };
export type UpdateAppointmentTypeData = UpdateAppointmentTypeInput & { tenantId: string };

export type AppointmentType = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AppointmentTypeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
