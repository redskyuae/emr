import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';

export type VoidInvoiceRequest = {
  voidReason: string;
};

export type VoidInvoiceResponse = {
  data: Invoice;
};
