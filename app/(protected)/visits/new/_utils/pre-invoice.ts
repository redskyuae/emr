export type ServiceLine = {
  id: string;
  service: string;
  subService: string;
  cpt: string;
  quantity: number;
  baseGross: number;
  waived?: boolean;
};

export const SERVICE_OPTIONS = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'investigation', label: 'Investigation' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'other', label: 'Other' },
];

const CONSULTATION_FEE_BY_VISIT_MODE: Record<string, number> = {
  'primary-visit': 200,
  'major-visit': 350,
  'new-visit': 200,
  'referral-visit': 150,
  'follow-up-visit': 100,
  'follow-up-without-consultation': 0,
  'procedure-visit': 300,
  'top-up-visit': 100,
  'top-up-primary-visit': 250,
};

const DEFAULT_CONSULTATION_FEE = 200;
const DEFAULT_CONSULTATION_CPT = '99201';

export function getConsultationFee(visitModeId: string): number {
  return CONSULTATION_FEE_BY_VISIT_MODE[visitModeId] ?? DEFAULT_CONSULTATION_FEE;
}

export function createConsultationLine(
  subService: string,
  visitModeId: string,
  waived: boolean
): ServiceLine {
  return {
    id: createServiceLineId(),
    service: 'consultation',
    subService,
    cpt: DEFAULT_CONSULTATION_CPT,
    quantity: 1,
    baseGross: getConsultationFee(visitModeId),
    waived,
  };
}

export function createEmptyServiceLine(): ServiceLine {
  return {
    id: createServiceLineId(),
    service: 'consultation',
    subService: '',
    cpt: '',
    quantity: 1,
    baseGross: 0,
  };
}

export function netGrossForLine(line: ServiceLine): number {
  return line.waived ? 0 : line.baseGross * line.quantity;
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function createServiceLineId(): string {
  return `line-${Math.random().toString(36).slice(2, 10)}`;
}
