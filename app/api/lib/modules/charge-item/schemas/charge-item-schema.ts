import { z } from 'zod';

import {
  CHARGE_ITEM_CATEGORIES,
  CHARGE_ITEM_CODE_TYPES,
  VISIT_CHARGE_KINDS,
} from '@/app/db/schema/charge-item';

export { CHARGE_ITEM_CODE_TYPES };

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const chargeItemNameSchema = z
  .string({ error: 'Charge item name is required' })
  .trim()
  .min(1, 'Charge item name cannot be empty')
  .max(150, 'Charge item name must be at most 150 characters')
  .regex(
    /^(?=.*\p{L})[\p{L}\p{N} ,&'()\p{Pd}/-]+$/u,
    'Charge item name contains unsupported characters.'
  );

const chargeItemCodeSchema = z
  .string({ error: 'Charge item code is required' })
  .trim()
  .min(1, 'Charge item code cannot be empty')
  .max(20, 'Charge item code must be at most 20 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Charge item code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const chargeItemCodeTypeSchema = z.enum(CHARGE_ITEM_CODE_TYPES, {
  error: `Charge item code type must be one of ${CHARGE_ITEM_CODE_TYPES.join(', ')}`,
});

// CPT and HCPCS codes have fixed shapes that payers validate on claims; SERVICE
// (UAE regulator service code) and LOCAL (Tenant code) keep the general code rule.
const CHARGE_ITEM_CODE_FORMATS: Partial<
  Record<ChargeItemCodeType, { pattern: RegExp; message: string }>
> = {
  CPT: {
    pattern: /^\d{4}[0-9FTU]$/,
    message: 'Charge item code must be a valid 5-character CPT code, e.g. 99213.',
  },
  HCPCS: {
    pattern: /^[A-V]\d{4}$/,
    message: 'Charge item code must be a valid HCPCS code, e.g. J1100.',
  },
};

export function getChargeItemCodeFormatError(code: string, codeType: ChargeItemCodeType) {
  const format = CHARGE_ITEM_CODE_FORMATS[codeType];

  return format && !format.pattern.test(code) ? format.message : undefined;
}

const chargeItemCategorySchema = z.enum(CHARGE_ITEM_CATEGORIES, {
  error: `Charge item category must be one of ${CHARGE_ITEM_CATEGORIES.join(', ')}`,
});

// A blank string coerces to 0 via plain Number('') === 0, which would let a
// required price silently pass validation as free — treat blank/null the same
// as absent so the "is required" error fires instead of a $0 Charge Item.
const chargeItemUnitPriceSchema = z.preprocess(
  (value) =>
    value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value,
  z.coerce
    .number({ error: 'Charge item unit price is required' })
    .nonnegative('Charge item unit price must be zero or more')
    .max(9_999_999_999, 'Charge item unit price is too large')
    .transform((value) => Math.round(value * 100) / 100)
);

const optionalPriceSchema = (label: string) =>
  z.preprocess(
    (value) => (value === '' ? null : typeof value === 'string' ? Number(value) : value),
    z
      .number({ error: `${label} must be a number` })
      .nonnegative(`${label} must be zero or more`)
      .max(9_999_999_999, `${label} is too large`)
      .transform((value) => Math.round(value * 100) / 100)
      .nullable()
      .optional()
  );

const effectiveDateSchema = z
  .union([
    z.iso.date({ error: 'Effective date must be a valid date in YYYY-MM-DD format' }),
    z.null(),
  ])
  .optional();

const chargeItemDescriptionSchema = z
  .union([
    z.string().trim().max(500, 'Charge item description must be at most 500 characters'),
    z.null(),
  ])
  .transform((value) => {
    if (value === null) {
      return undefined;
    }

    return value === '' ? undefined : value;
  })
  .optional();

const chargeItemIsActiveSchema = z.boolean().optional().default(true);

export const chargeItemIdSchema = z.coerce
  .number({ error: 'Charge item ID is required' })
  .int('Charge item ID must be an integer')
  .positive('Charge item ID must be positive');

export const chargeItemTenantIdSchema = tenantIdSchema;

export const chargeItemCategoryFilterSchema = chargeItemCategorySchema.optional();

const chargeItemBaseSchema = z.object({
  name: chargeItemNameSchema,
  code: chargeItemCodeSchema,
  codeType: chargeItemCodeTypeSchema.optional(),
  category: chargeItemCategorySchema,
  unitPrice: chargeItemUnitPriceSchema,
  cashPrice: optionalPriceSchema('Cash price'),
  insuranceContractPrice: optionalPriceSchema('Insurance contract price'),
  freeFollowUpEligible: z.boolean().optional(),
  effectiveDate: effectiveDateSchema,
  visitChargeKind: z.enum(VISIT_CHARGE_KINDS).nullable().optional(),
  description: chargeItemDescriptionSchema,
  isActive: z.boolean().optional(),
});

function validateVisitPricing(
  value: z.infer<typeof chargeItemBaseSchema>,
  context: z.RefinementCtx
) {
  const codeFormatError = value.codeType
    ? getChargeItemCodeFormatError(value.code, value.codeType)
    : undefined;

  if (codeFormatError) {
    context.addIssue({ code: 'custom', path: ['code'], message: codeFormatError });
  }
  if (value.visitChargeKind === 'TREATMENT_SESSION' && value.category !== 'PROCEDURE') {
    context.addIssue({
      code: 'custom',
      path: ['visitChargeKind'],
      message: 'Treatment Session Charge Items must have Procedure category',
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
      message: 'Consultation Charge Items must have Consultation category',
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
      message:
        'Only Follow-up or Established Consultation Charge Items can be free follow-up eligible',
    });
  }
}

export const createChargeItemSchema = chargeItemBaseSchema
  .extend({
    isActive: chargeItemIsActiveSchema,
    codeType: chargeItemCodeTypeSchema.optional().default('LOCAL'),
  })
  .superRefine(validateVisitPricing);

// Unlike create, isActive has no default here: omitting it on update means
// "leave the current Active state as-is," not "reactivate." Defaulting it to
// true (as create does) would silently reactivate a deliberately-retired
// Charge Item for any client that only means to edit name/code/price.
// The validator fills the omitted value from the existing row. codeType follows
// the same rule, so an edit that omits it never reclassifies a CPT Charge Item.
export const updateChargeItemSchema = chargeItemBaseSchema.superRefine(validateVisitPricing);

export type ChargeItemCategory = (typeof CHARGE_ITEM_CATEGORIES)[number];
export type ChargeItemCodeType = (typeof CHARGE_ITEM_CODE_TYPES)[number];
export type VisitChargeKind = (typeof VISIT_CHARGE_KINDS)[number];
export type ChargeItemIdInput = z.infer<typeof chargeItemIdSchema>;
export type ChargeItemTenantIdInput = z.infer<typeof chargeItemTenantIdSchema>;
export type CreateChargeItemInput = z.infer<typeof createChargeItemSchema>;
export type UpdateChargeItemInput = z.infer<typeof updateChargeItemSchema>;
export type CreateChargeItemData = CreateChargeItemInput & { tenantId: string };
export type UpdateChargeItemData = UpdateChargeItemInput & { tenantId: string };

export type ChargeItem = {
  id: number;
  name: string;
  code: string;
  tenantId: string;
  codeType: ChargeItemCodeType;
  isActive: boolean;
  unitPrice: number;
  cashPrice: number | null;
  insuranceContractPrice: number | null;
  freeFollowUpEligible: boolean;
  effectiveDate: string | null;
  visitChargeKind: VisitChargeKind | null;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
  category: ChargeItemCategory;
};

export type ChargeItemListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
  isActive?: boolean;
  category?: ChargeItemCategory;
};
