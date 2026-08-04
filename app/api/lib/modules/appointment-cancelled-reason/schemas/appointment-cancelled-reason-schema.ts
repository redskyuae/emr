import { z } from 'zod';
import {
  nullableToOptionalSimpleMasterDescriptionSchema,
  simpleMasterCodeSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentCancelledReasonNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Appointment cancelled reason name',
  maxMessage: 'Appointment cancelled reason name must be at most 100 characters',
  emptyMessage: 'Appointment cancelled reason name cannot be empty',
  requiredMessage: 'Appointment cancelled reason name is required',
});

const appointmentCancelledReasonCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Appointment cancelled reason code',
  maxMessage: 'Appointment cancelled reason code must be at most 10 characters',
  emptyMessage: 'Appointment cancelled reason code cannot be empty',
  requiredMessage: 'Appointment cancelled reason code is required',
});

const appointmentCancelledReasonDescriptionSchema = nullableToOptionalSimpleMasterDescriptionSchema({
  maxMessage: 'Appointment cancelled reason description must be at most 500 characters',
});

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
