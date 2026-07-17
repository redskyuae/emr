import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const visitTypeNameSchema = z
  .string({ error: 'Visit type name is required' })
  .trim()
  .min(1, 'Visit type name cannot be empty')
  .max(100, 'Visit type name must be at most 100 characters');

const visitTypeCodeSchema = z
  .string({ error: 'Visit type code is required' })
  .trim()
  .min(1, 'Visit type code cannot be empty')
  .max(10, 'Visit type code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const visitTypeDescriptionSchema = z
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
