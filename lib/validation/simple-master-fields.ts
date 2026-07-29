import { z } from 'zod';

export const SIMPLE_MASTER_NAME_ALLOWED_CHARACTERS =
  'letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses';

export const SIMPLE_MASTER_CODE_ALLOWED_CHARACTERS = 'letters, numbers, hyphens, and underscores';
export const SIMPLE_MASTER_DESCRIPTION_MAX = 500;

const simpleMasterNamePattern = /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u;
const simpleMasterCodePattern = /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/;

type SimpleMasterTextFieldOptions = {
  max: number;
  fieldName: string;
  maxMessage: string;
  emptyMessage: string;
  requiredMessage?: string;
};

type SimpleMasterDescriptionFieldOptions = {
  max?: number;
  maxMessage: string;
};

export function simpleMasterNameSchema({
  max,
  fieldName,
  maxMessage,
  emptyMessage,
  requiredMessage,
}: SimpleMasterTextFieldOptions) {
  return z
    .string(requiredMessage ? { error: requiredMessage } : undefined)
    .trim()
    .min(1, emptyMessage)
    .max(max, maxMessage)
    .regex(
      simpleMasterNamePattern,
      `${fieldName} must contain only ${SIMPLE_MASTER_NAME_ALLOWED_CHARACTERS}.`
    );
}

export function simpleMasterCodeSchema({
  max,
  fieldName,
  maxMessage,
  emptyMessage,
  requiredMessage,
}: SimpleMasterTextFieldOptions) {
  return z
    .string(requiredMessage ? { error: requiredMessage } : undefined)
    .trim()
    .min(1, emptyMessage)
    .max(max, maxMessage)
    .regex(
      simpleMasterCodePattern,
      `${fieldName} must contain only ${SIMPLE_MASTER_CODE_ALLOWED_CHARACTERS}.`
    )
    .transform((code) => code.toUpperCase());
}

export function optionalSimpleMasterCodeSchema({
  max,
  fieldName,
  maxMessage,
}: Pick<SimpleMasterTextFieldOptions, 'max' | 'fieldName' | 'maxMessage'>) {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return undefined;
      }

      if (typeof value !== 'string') {
        return value;
      }

      const code = value.trim();
      return code === '' ? undefined : code;
    },
    z
      .string()
      .max(max, maxMessage)
      .regex(
        simpleMasterCodePattern,
        `${fieldName} must contain only ${SIMPLE_MASTER_CODE_ALLOWED_CHARACTERS}.`
      )
      .transform((code) => code.toUpperCase())
      .optional()
  );
}

export function simpleMasterDescriptionSchema({
  max = SIMPLE_MASTER_DESCRIPTION_MAX,
  maxMessage,
}: SimpleMasterDescriptionFieldOptions) {
  return z
    .string()
    .trim()
    .max(max, maxMessage)
    .transform((description) => (description === '' ? undefined : description))
    .optional();
}

export function nullableToOptionalSimpleMasterDescriptionSchema({
  max = SIMPLE_MASTER_DESCRIPTION_MAX,
  maxMessage,
}: SimpleMasterDescriptionFieldOptions) {
  return z
    .union([z.string().trim().max(max, maxMessage), z.null()])
    .transform((value) => {
      if (value === null) {
        return undefined;
      }

      return value === '' ? undefined : value;
    })
    .optional();
}

export function nullableSimpleMasterDescriptionSchema({
  max = SIMPLE_MASTER_DESCRIPTION_MAX,
  maxMessage,
}: SimpleMasterDescriptionFieldOptions) {
  return z
    .union([z.string().trim().max(max, maxMessage), z.null()])
    .transform((value) => (value === '' ? null : value))
    .optional();
}
