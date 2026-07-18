import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';

export type AddInvoiceLineRequest = {
  chargeItemId: number;
  quantity: number;
  unitPrice?: number;
};

export type AddInvoiceLineResponse = {
  data: Invoice;
};
