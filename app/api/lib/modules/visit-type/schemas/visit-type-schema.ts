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

const visitTypeNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Visit type name',
  maxMessage: 'Visit type name must be at most 100 characters',
  emptyMessage: 'Visit type name cannot be empty',
  requiredMessage: 'Visit type name is required',
});

const visitTypeCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Visit type code',
  maxMessage: 'Visit type code must be at most 10 characters',
  emptyMessage: 'Visit type code cannot be empty',
  requiredMessage: 'Visit type code is required',
});

const visitTypeDescriptionSchema = nullableToOptionalSimpleMasterDescriptionSchema({
  maxMessage: 'Visit type description must be at most 500 characters',
});

export const visitTypeIdSchema = z.coerce
  .number({ error: 'Visit type ID is required' })
  .int('Visit type ID must be an integer')
  .positive('Visit type ID must be positive');

export const visitTypeTenantIdSchema = tenantIdSchema;

export const createVisitTypeSchema = z.object({
  name: visitTypeNameSchema,
  code: visitTypeCodeSchema,
  description: visitTypeDescriptionSchema,
});

export const updateVisitTypeSchema = createVisitTypeSchema;

export type VisitTypeIdInput = z.infer<typeof visitTypeIdSchema>;
export type VisitTypeTenantIdInput = z.infer<typeof visitTypeTenantIdSchema>;
export type CreateVisitTypeInput = z.infer<typeof createVisitTypeSchema>;
export type UpdateVisitTypeInput = z.infer<typeof updateVisitTypeSchema>;
export type CreateVisitTypeData = CreateVisitTypeInput & { tenantId: string };
export type UpdateVisitTypeData = UpdateVisitTypeInput & { tenantId: string };

export type VisitType = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type VisitTypeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
