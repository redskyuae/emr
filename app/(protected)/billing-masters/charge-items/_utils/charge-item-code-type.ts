import {
  CHARGE_ITEM_CODE_TYPES,
  type ChargeItemCodeType,
} from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';

type ChargeItemCodeTypeDetails = {
  label: string;
  badge: string;
  help: string;
  codeLabel: string;
  placeholder: string;
};

const CHARGE_ITEM_CODE_TYPE_DETAILS: Record<ChargeItemCodeType, ChargeItemCodeTypeDetails> = {
  CPT: {
    badge: 'CPT',
    label: 'CPT',
    placeholder: '99213',
    codeLabel: 'CPT code',
    help: 'Enter the verified 5-character CPT code, e.g. 99213. A Visit type does not determine a CPT level.',
  },
  HCPCS: {
    badge: 'HCPCS',
    label: 'HCPCS',
    placeholder: 'J1100',
    codeLabel: 'HCPCS code',
    help: 'Enter the HCPCS Level II code: one letter and four digits, e.g. J1100.',
  },
  SERVICE: {
    badge: 'Service',
    label: 'UAE service code',
    codeLabel: 'UAE service code',
    placeholder: 'Regulator service code',
    help: 'Enter the service code issued by the UAE health regulator for a service without a CPT code.',
  },
  LOCAL: {
    badge: 'Local',
    label: 'Local code',
    codeLabel: 'Local code',
    placeholder: 'CONS_EST',
    help: "Enter this Tenant's own code for an item with no standard code. Letters, numbers, hyphens and underscores.",
  },
};

export const CHARGE_ITEM_CODE_TYPE_OPTIONS = CHARGE_ITEM_CODE_TYPES.map((value) => ({
  value,
  label: CHARGE_ITEM_CODE_TYPE_DETAILS[value].label,
}));

export function getChargeItemCodeTypeDetails(codeType: ChargeItemCodeType) {
  return CHARGE_ITEM_CODE_TYPE_DETAILS[codeType];
}
