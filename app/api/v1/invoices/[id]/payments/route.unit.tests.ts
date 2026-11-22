import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  analyticsActorFromSession,
  recordServerEventAfterLookup,
} from '@/app/api/lib/analytics/server-analytics';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { recordPaymentCommand } from '@/app/api/lib/modules/invoice/commands/record-payment-command';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user-1', tenantId: 'tenant-1' })),
  recordServerEventAfterLookup: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/invoice/commands/record-payment-command', () => ({
  recordPaymentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/invoice/queries/get-invoice-by-id-query', () => ({
  getInvoiceByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/queries/get-visit-by-id-query', () => ({
  getVisitByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const recordPayment = vi.mocked(recordPaymentCommand);
const getVisit = vi.mocked(getVisitByIdQuery);
const requireSession = vi.mocked(requireTenantSession);
const recordAfterLookup = vi.mocked(recordServerEventAfterLookup);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '5' }) };
const payment = {
  id: 1,
  amount: 300,
  method: 'CASH',
  receiptNumber: 'RCP-1',
  receivedAt: new Date('2026-11-21T09:45:00.000Z'),
};
const invoice = {
  id: 5,
  status: 'PAID',
  invoiceNumber: 'INV-1001',
  patient: { id: 9, mrn: 'MRN-9', firstName: 'Aisha', lastName: 'Khan' },
  visit: { id: 77, visitNumber: 'VST-1' },
  admission: null,
  payments: [payment],
};

function request() {
  return new NextRequest('http://localhost/api/v1/invoices/5/payments', {
    method: 'POST',
    body: JSON.stringify({ method: 'CASH', amount: 300 }),
  });
}

describe('Record Payment route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
  });

  it('should respond without reading the Visit, and read it only in the after-response lookup', async () => {
    recordPayment.mockResolvedValue({ success: true, data: { invoice, payment } } as never);
    getVisit.mockResolvedValue({
      success: true,
      data: { id: 77, checkedInAt: new Date('2026-11-21T09:00:00.000Z') },
    } as never);

    const response = await POST(request(), context);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(getVisit).not.toHaveBeenCalled();
    expect(analyticsActorFromSession).toHaveBeenCalledWith(tenantSession, expect.anything());
    expect(recordAfterLookup).toHaveBeenCalledWith(
      { userId: 'user-1', tenantId: 'tenant-1' },
      'payment_recorded',
      expect.any(Function)
    );

    const [, , lookup] = recordAfterLookup.mock.calls[0];
    await expect(lookup()).resolves.toMatchObject({
      payment_method: 'CASH',
      linked_to: 'visit',
      minutes_since_visit_check_in: 45,
    });
    expect(getVisit).toHaveBeenCalledWith(77, 'tenant-1');
  });

  it('should still record the payment when the Visit cannot be read', async () => {
    recordPayment.mockResolvedValue({ success: true, data: { invoice, payment } } as never);
    getVisit.mockResolvedValue({ success: false, errors: ['Visit not found'] } as never);

    await POST(request(), context);

    const [, , lookup] = recordAfterLookup.mock.calls[0];
    const properties = await lookup();
    expect(properties).toMatchObject({ payment_method: 'CASH' });
    expect(properties).not.toHaveProperty('minutes_since_visit_check_in', expect.any(Number));
  });

  it('should record a payment.record Audit Event with the method and amount', async () => {
    recordPayment.mockResolvedValue({ success: true, data: { invoice, payment } } as never);

    await POST(request(), context);

    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'payment.record',
      expect.objectContaining({
        entityId: 1,
        visitId: 77,
        patientId: 9,
        entityLabel: 'RCP-1',
        metadata: expect.objectContaining({ invoiceId: 5, method: 'CASH', amount: 300 }),
      })
    );
  });

  it('should record nothing when the payment is rejected', async () => {
    recordPayment.mockResolvedValue({
      success: false,
      errors: ['Invoice INV-1001 is not open for payment.'],
      status: StatusCodes.CONFLICT,
    });

    const response = await POST(request(), context);

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(recordAfterLookup).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
