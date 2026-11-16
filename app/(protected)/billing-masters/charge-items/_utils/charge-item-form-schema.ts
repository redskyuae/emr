import { z } from 'zod';

import { CHARGE_ITEM_CATEGORIES, VISIT_CHARGE_KINDS } from '@/app/db/schema/charge-item';
import {
  CHARGE_ITEM_CODE_TYPES,
  getChargeItemCodeFormatError,
} from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';

// Client-side mirror of the create/update Charge Item contract. Name, code,
// category and unit price are required; the API schema stays the server contract.
// Code type is optional on create (the server defaults it to Local), so the form
// always sends one and it carries no asterisk.
export const chargeItemFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required.')
      .max(150, 'Name must be at most 150 characters.')
      .regex(/^(?=.*\p{L})[\p{L}\p{N} ,&'()\p{Pd}/-]+$/u, 'Name contains unsupported characters.'),
    code: z
      .string()
      .trim()
      .min(1, 'Code is required.')
      .max(20, 'Code must be at most 20 characters.')
      .regex(
        /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
        'Code must contain only letters, numbers, hyphens, and underscores.'
      )
      .transform((code) => code.toUpperCase()),
    codeType: z.enum(CHARGE_ITEM_CODE_TYPES, { error: 'Code type is required.' }),
    category: z.enum(CHARGE_ITEM_CATEGORIES, { error: 'Category is required.' }),
    unitPrice: z
      .string()
      .trim()
      .min(1, 'Unit price is required.')
      .refine((value) => !Number.isNaN(Number(value)), 'Unit price must be a number.')
      .refine((value) => Number(value) >= 0, 'Unit price must be zero or more.'),
    cashPrice: z
      .string()
      .refine(
        (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
        'Cash price must be zero or more.'
      ),
    insuranceContractPrice: z
      .string()
      .refine(
        (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
        'Insurance contract price must be zero or more.'
      ),
    effectiveDate: z.union([z.iso.date(), z.literal('')]),
    freeFollowUpEligible: z.boolean(),
    visitChargeKind: z.union([z.enum(VISIT_CHARGE_KINDS), z.literal('')]),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters.')
      .transform((description) => (description === '' ? undefined : description))
      .optional(),
    isActive: z.boolean(),
  })
  // Runs as soon as code and code type parse, even while other fields are still
  // invalid, so a CPT/HCPCS mismatch shows on blur like any other code error.
  .superRefine(
    (value, context) => {
      // Same CPT/HCPCS format rule and exact message as the server contract.
      const codeFormatError = getChargeItemCodeFormatError(value.code, value.codeType);
      if (codeFormatError) {
        context.addIssue({ code: 'custom', path: ['code'], message: codeFormatError });
      }
    },
    {
      when: ({ issues }) =>
        !issues.some(({ path }) => path?.[0] === 'code' || path?.[0] === 'codeType'),
    }
  )
  .superRefine((value, context) => {
    if (value.visitChargeKind === 'TREATMENT_SESSION' && value.category !== 'PROCEDURE') {
      context.addIssue({
        code: 'custom',
        path: ['visitChargeKind'],
        message: 'Treatment Session requires Procedure category.',
      });
    }
    if (
      value.visitChargeKind &&
      value.visitChargeKind !== 'TREATMENT_SESSION' &&
      value.category !== 'CONSULTATION'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['visitChargeKind'],
        message: 'Consultation services require Consultation category.',
      });
    }
    if (
      value.freeFollowUpEligible &&
      value.visitChargeKind !== 'FOLLOW_UP_CONSULTATION' &&
      value.visitChargeKind !== 'ESTABLISHED_CONSULTATION'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['freeFollowUpEligible'],
        message: 'Only a Follow-up or Established Consultation can be free follow-up eligible.',
      });
    }
  });

export type ChargeItemFormValues = z.infer<typeof chargeItemFormSchema>;
