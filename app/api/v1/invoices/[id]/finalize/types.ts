import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';

export type FinalizeInvoiceResponse = {
  data: Invoice;
};
