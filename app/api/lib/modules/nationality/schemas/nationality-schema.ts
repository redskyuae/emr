import { z } from 'zod';

const nationalityNameSchema = z
  .string({ error: 'Nationality name is required' })
  .trim()
  .min(1, 'Nationality name cannot be empty')
  .max(100, 'Nationality name must be at most 100 characters');

const nationalityCodeSchema = z
  .string({ error: 'Nationality code is required' })
  .trim()
  .min(1, 'Nationality code cannot be empty')
  .max(10, 'Nationality code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

export const nationalityIdSchema = z.coerce
  .number({ message: 'Nationality ID is required' })
  .int('Nationality ID must be an integer')
  .positive('Nationality ID must be positive');

export const createNationalitySchema = z.object({
  name: nationalityNameSchema,
  code: nationalityCodeSchema,
});

export const updateNationalitySchema = createNationalitySchema;

export type NationalityIdInput = z.infer<typeof nationalityIdSchema>;
export type CreateNationalityInput = z.infer<typeof createNationalitySchema>;
export type UpdateNationalityInput = z.infer<typeof updateNationalitySchema>;

export type Nationality = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type NationalityListParams = {
  query?: string;
  page?: number;
  limit?: number;
};
