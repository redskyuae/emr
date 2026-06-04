import { z } from 'zod';

const languageNameSchema = z
  .string({ error: 'Language name is required' })
  .trim()
  .min(1, 'Language name cannot be empty')
  .max(100, 'Language name must be at most 100 characters');

const languageCodeSchema = z
  .string({ error: 'Language code is required' })
  .trim()
  .min(1, 'Language code cannot be empty')
  .max(10, 'Language code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

export const languageIdSchema = z.coerce
  .number({ message: 'Language ID is required' })
  .int('Language ID must be an integer')
  .positive('Language ID must be positive');

export const createLanguageSchema = z.object({
  name: languageNameSchema,
  code: languageCodeSchema,
});

export const updateLanguageSchema = createLanguageSchema;

export type LanguageIdInput = z.infer<typeof languageIdSchema>;
export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;

export type Language = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type LanguageListParams = {
  query?: string;
  page?: number;
  limit?: number;
};
