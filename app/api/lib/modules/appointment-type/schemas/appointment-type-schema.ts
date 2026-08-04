import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const appointmentTypeNameSchema = z
  .string({ error: 'Appointment type name is required' })
  .trim()
  .min(1, 'Appointment type name cannot be empty')
  .max(100, 'Appointment type name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Appointment type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const appointmentTypeCodeSchema = z
  .string({ error: 'Appointment type code is required' })
  .trim()
  .min(1, 'Appointment type code cannot be empty')
  .max(10, 'Appointment type code must be at most 10 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Appointment type code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const appointmentTypeDescriptionSchema = z
  .union([
    z.string().trim().max(500, 'Appointment type description must be at most 500 characters'),
    z.null(),
  ])
  .transform((value) => {
    if (value === null) {
      return undefined;
    }

    return value === '' ? undefined : value;
  })
  .optional();

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
