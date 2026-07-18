import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';

export type ListPaymentsResponse = {
  data: Payment[];
};

export type RecordPaymentRequest = {
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
  receivedAt?: string | null;
};

export type RecordPaymentResponse = {
  data: {
    invoice: Invoice;
    payment: Payment;
  };
};
