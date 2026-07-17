import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const admissionTypeNameSchema = z
  .string({ error: 'Admission type name is required' })
  .trim()
  .min(1, 'Admission type name cannot be empty')
  .max(100, 'Admission type name must be at most 100 characters');

const admissionTypeCodeSchema = z
  .string({ error: 'Admission type code is required' })
  .trim()
  .min(1, 'Admission type code cannot be empty')
  .max(10, 'Admission type code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const admissionTypeDescriptionSchema = z
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

export const admissionTypeIdSchema = z.coerce
  .number({ error: 'Admission type ID is required' })
  .int('Admission type ID must be an integer')
  .positive('Admission type ID must be positive');

export const admissionTypeTenantIdSchema = tenantIdSchema;

export const createAdmissionTypeSchema = z.object({
  name: admissionTypeNameSchema,
  code: admissionTypeCodeSchema,
  description: admissionTypeDescriptionSchema,
});

export const updateAdmissionTypeSchema = createAdmissionTypeSchema;

export type AdmissionTypeIdInput = z.infer<typeof admissionTypeIdSchema>;
export type AdmissionTypeTenantIdInput = z.infer<typeof admissionTypeTenantIdSchema>;
export type CreateAdmissionTypeInput = z.infer<typeof createAdmissionTypeSchema>;
export type UpdateAdmissionTypeInput = z.infer<typeof updateAdmissionTypeSchema>;
export type CreateAdmissionTypeData = CreateAdmissionTypeInput & { tenantId: string };
export type UpdateAdmissionTypeData = UpdateAdmissionTypeInput & { tenantId: string };

export type AdmissionType = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AdmissionTypeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
