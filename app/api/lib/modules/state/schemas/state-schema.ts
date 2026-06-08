import { z } from 'zod';

const stateNameSchema = z
  .string({ error: 'State name is required' })
  .trim()
  .min(1, 'State name cannot be empty')
  .max(100, 'State name must be at most 100 characters');

export const stateIdSchema = z.coerce
  .number({ error: 'State ID is required' })
  .int('State ID must be an integer')
  .positive('State ID must be positive');

export const stateCountryIdSchema = z.coerce
  .number({ error: 'Country ID is required' })
  .int('Country ID must be an integer')
  .positive('Country ID must be positive');

export const createStateSchema = z.object({
  name: stateNameSchema,
  countryId: stateCountryIdSchema,
});

export const updateStateSchema = createStateSchema;

export type StateIdInput = z.infer<typeof stateIdSchema>;
export type StateCountryIdInput = z.infer<typeof stateCountryIdSchema>;
export type CreateStateInput = z.infer<typeof createStateSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;

export type StateCountry = {
  id: number;
  name: string;
  code: string;
};

export type State = {
  id: number;
  name: string;
  countryId: number;
  country: StateCountry;
  createdOn: Date;
  modifiedOn: Date;
};

export type StateListParams = {
  query?: string;
  countryId?: number;
  page?: number;
  limit?: number;
};
