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

const appointmentReasonNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Appointment reason name',
  maxMessage: 'Appointment reason name must be at most 100 characters',
  emptyMessage: 'Appointment reason name cannot be empty',
  requiredMessage: 'Appointment reason name is required',
});

const appointmentReasonCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Appointment reason code',
  maxMessage: 'Appointment reason code must be at most 10 characters',
  emptyMessage: 'Appointment reason code cannot be empty',
  requiredMessage: 'Appointment reason code is required',
});

const appointmentReasonDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Appointment reason description must be at most 500 characters',
});

export const appointmentReasonIdSchema = z.coerce
  .number({ error: 'Appointment reason ID is required' })
  .int('Appointment reason ID must be an integer')
  .positive('Appointment reason ID must be positive');

export const appointmentReasonTenantIdSchema = tenantIdSchema;

export const createAppointmentReasonSchema = z.object({
  name: appointmentReasonNameSchema,
  code: appointmentReasonCodeSchema,
  description: appointmentReasonDescriptionSchema,
});

export const updateAppointmentReasonSchema = createAppointmentReasonSchema;

export type AppointmentReasonIdInput = z.infer<typeof appointmentReasonIdSchema>;
export type AppointmentReasonTenantIdInput = z.infer<typeof appointmentReasonTenantIdSchema>;
export type CreateAppointmentReasonInput = z.infer<typeof createAppointmentReasonSchema>;
export type UpdateAppointmentReasonInput = z.infer<typeof updateAppointmentReasonSchema>;
export type CreateAppointmentReasonData = CreateAppointmentReasonInput & { tenantId: string };
export type UpdateAppointmentReasonData = UpdateAppointmentReasonInput & { tenantId: string };

export type AppointmentReason = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AppointmentReasonListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
