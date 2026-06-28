import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentReasonNameSchema = z
  .string({ error: 'Appointment reason name is required' })
  .trim()
  .min(1, 'Appointment reason name cannot be empty')
  .max(100, 'Appointment reason name must be at most 100 characters');

const appointmentReasonCodeSchema = z
  .string({ error: 'Appointment reason code is required' })
  .trim()
  .min(1, 'Appointment reason code cannot be empty')
  .max(10, 'Appointment reason code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const appointmentReasonDescriptionSchema = z
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
