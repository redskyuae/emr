import { z } from 'zod';

const religionNameSchema = z
  .string({ error: 'Religion name is required' })
  .trim()
  .min(1, 'Religion name cannot be empty')
  .max(100, 'Religion name must be at most 100 characters');

const religionCodeSchema = z
  .string({ error: 'Religion code is required' })
  .trim()
  .min(1, 'Religion code cannot be empty')
  .max(10, 'Religion code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

export const religionIdSchema = z.coerce
  .number({ message: 'Religion ID is required' })
  .int('Religion ID must be an integer')
  .positive('Religion ID must be positive');

export const createReligionSchema = z.object({
  name: religionNameSchema,
  code: religionCodeSchema,
});

export const updateReligionSchema = createReligionSchema;

export type ReligionIdInput = z.infer<typeof religionIdSchema>;
export type CreateReligionInput = z.infer<typeof createReligionSchema>;
export type UpdateReligionInput = z.infer<typeof updateReligionSchema>;

export type Religion = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type ReligionListParams = {
  page?: number;
  query?: string;
  limit?: number;
};
