import { z } from 'zod';

const stateNameSchema = z.any().superRefine((val, ctx) => {
  if (val === undefined || val === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'State name is required',
    });
    return;
  }
  if (typeof val !== 'string') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'State name must be a string',
    });
    return;
  }
  const trimmed = val.trim();
  if (trimmed.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'State name cannot be empty',
    });
    return;
  }
  if (trimmed.length > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'State name must be at most 100 characters',
    });
    return;
  }
}) as unknown as z.ZodType<string>;

export const stateIdSchema = z.coerce
  .number({ error: 'State ID is required' })
  .int('State ID must be an integer')
  .positive('State ID must be positive');

export const stateCountryIdSchema = z.any().superRefine((val, ctx) => {
  if (val === undefined || val === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'country Id is required',
    });
    return;
  }
  if (typeof val === 'string') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'country Id must be integer',
    });
    return;
  }
  if (typeof val !== 'number') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'country Id must be integer',
    });
    return;
  }
  if (!Number.isInteger(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'country Id must be integer',
    });
    return;
  }
  if (val <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'country Id must be positive',
    });
    return;
  }
}) as unknown as z.ZodType<number>;

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
  createdOn: Date;
  modifiedOn: Date;
  countryId: number;
  country: StateCountry;
};

export type StateListParams = {
  page?: number;
  query?: string;
  limit?: number;
  countryId?: number;
};
