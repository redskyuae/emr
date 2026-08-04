import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const doctorRotaNameSchema = z
  .string({ error: 'Doctor rota name is required' })
  .trim()
  .min(1, 'Doctor rota name cannot be empty')
  .max(100, 'Doctor rota name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Doctor rota name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const doctorRotaTimeSchema = (fieldName: string) =>
  z
    .string({ error: `Doctor rota ${fieldName} time is required` })
    .trim()
    .min(1, `Doctor rota ${fieldName} time cannot be empty`)
    .regex(timePattern, `Doctor rota ${fieldName} time must be in HH:mm format`);

function minutesOf(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

const doctorRotaPayloadSchema = z
  .object({
    name: doctorRotaNameSchema,
    toTime: doctorRotaTimeSchema('to'),
    fromTime: doctorRotaTimeSchema('from'),
  })
  .refine((data) => minutesOf(data.toTime) > minutesOf(data.fromTime), {
    path: ['toTime'],
    message: 'Doctor rota to time must be after from time',
  });

export const doctorRotaIdSchema = z.coerce
  .number({ error: 'Doctor rota ID is required' })
  .int('Doctor rota ID must be an integer')
  .positive('Doctor rota ID must be positive');

export const doctorRotaTenantIdSchema = tenantIdSchema;

export const createDoctorRotaSchema = doctorRotaPayloadSchema;
export const updateDoctorRotaSchema = doctorRotaPayloadSchema;

export type DoctorRotaIdInput = z.infer<typeof doctorRotaIdSchema>;
export type DoctorRotaTenantIdInput = z.infer<typeof doctorRotaTenantIdSchema>;
export type CreateDoctorRotaInput = z.infer<typeof createDoctorRotaSchema>;
export type UpdateDoctorRotaInput = z.infer<typeof updateDoctorRotaSchema>;
export type CreateDoctorRotaData = CreateDoctorRotaInput & { tenantId: string };
export type UpdateDoctorRotaData = UpdateDoctorRotaInput & { tenantId: string };

export type DoctorRota = {
  id: number;
  name: string;
  toTime: string;
  tenantId: string;
  fromTime: string;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
};

export type DoctorRotaListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
};
