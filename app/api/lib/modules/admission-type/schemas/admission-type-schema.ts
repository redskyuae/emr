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

const admissionTypeNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Admission type name',
  maxMessage: 'Admission type name must be at most 100 characters',
  emptyMessage: 'Admission type name cannot be empty',
  requiredMessage: 'Admission type name is required',
});

const admissionTypeCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Admission type code',
  maxMessage: 'Admission type code must be at most 10 characters',
  emptyMessage: 'Admission type code cannot be empty',
  requiredMessage: 'Admission type code is required',
});

const admissionTypeDescriptionSchema = nullableToOptionalSimpleMasterDescriptionSchema({
  maxMessage: 'Admission type description must be at most 500 characters',
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
