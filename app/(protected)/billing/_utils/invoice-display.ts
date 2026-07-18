import type {
  InvoiceStatus,
  PaymentMethod,
} from '@/app/api/lib/modules/invoice/schemas/invoice-schema';

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  FINALIZED: 'Finalized',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  VOID: 'Void',
};

const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  DRAFT: 'border-muted-foreground/30 text-muted-foreground',
  FINALIZED: 'border-blue-500/40 text-blue-600 dark:text-blue-400',
  PARTIALLY_PAID: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  PAID: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  VOID: 'border-destructive/40 text-destructive line-through',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

export const PAYMENT_METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (value) => ({ value, label: PAYMENT_METHOD_LABELS[value] })
);

// The default "Open" list view: everything a cashier still needs to act on.
export const OPEN_INVOICE_STATUSES = 'DRAFT,FINALIZED,PARTIALLY_PAID';

export function getInvoiceStatusLabel(status: InvoiceStatus) {
  return INVOICE_STATUS_LABELS[status];
}

export function getInvoiceStatusClassName(status: InvoiceStatus) {
  return INVOICE_STATUS_CLASSES[status];
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return PAYMENT_METHOD_LABELS[method];
}

export function formatMoney(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
