import { z } from 'zod';

const countryNameSchema = z
  .string({ error: 'Country name is required' })
  .trim()
  .min(1, 'Country name cannot be empty')
  .max(100, 'Country name must be at most 100 characters');

const countryCodeSchema = z
  .string({ error: 'Country code is required' })
  .trim()
  .min(1, 'Country code cannot be empty')
  .max(10, 'Country code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

export const countryIdSchema = z.coerce
  .number({ message: 'Country ID is required' })
  .int('Country ID must be an integer')
  .positive('Country ID must be positive');

export const createCountrySchema = z.object({
  name: countryNameSchema,
  code: countryCodeSchema,
});

export const updateCountrySchema = createCountrySchema;

export type CountryIdInput = z.infer<typeof countryIdSchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>;

export type Country = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type CountryListParams = {
  query?: string;
  page?: number;
  limit?: number;
};
