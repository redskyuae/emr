import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentTypeNameSchema = z
  .string({ error: 'Appointment type name is required' })
  .trim()
  .min(1, 'Appointment type name cannot be empty')
  .max(100, 'Appointment type name must be at most 100 characters');

const appointmentTypeCodeSchema = z
  .string({ error: 'Appointment type code is required' })
  .trim()
  .min(1, 'Appointment type code cannot be empty')
  .max(10, 'Appointment type code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const appointmentTypeDescriptionSchema = z
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
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  createdOn: Date;
  modifiedOn: Date;
};

export type AppointmentTypeListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
