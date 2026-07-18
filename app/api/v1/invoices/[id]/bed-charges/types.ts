import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';

export type GenerateBedChargesResponse = {
  data: {
    invoice: Invoice;
    linesAdded: number;
    warnings: string[];
  };
};
