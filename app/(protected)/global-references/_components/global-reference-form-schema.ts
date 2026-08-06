import { z } from 'zod';

export type GlobalReferenceFormKind = 'name-code' | 'state';

export type GlobalReferenceFormValues = {
  name: string;
  code: string;
  countryId: string;
};

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

const codeSchema = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(10, 'Code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

export function createGlobalReferenceFormSchema(kind: GlobalReferenceFormKind) {
  return z.object({
    name: nameSchema,
    code: kind === 'state' ? z.string() : codeSchema,
    countryId: kind === 'state' ? z.string().min(1, 'Country is required') : z.string(),
  });
}
