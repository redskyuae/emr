import type {
  Invoice,
  InvoiceListItem,
} from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListInvoicesResponse = Paginated<InvoiceListItem>;

export type CreateInvoiceRequest = {
  patientId: number;
  visitId?: number | null;
  admissionId?: number | null;
  notes?: string | null;
};

export type SaveInvoiceResponse = {
  data: Invoice;
};

export type GetInvoiceResponse = {
  data: Invoice;
};

export type UpdateDraftInvoiceRequest = {
  discountAmount?: number;
  notes?: string | null;
};

export type UpdateInvoiceResponse = {
  data: Invoice;
};
