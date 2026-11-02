// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import type { LedgerTxn } from '../../_utils/counter-types';
import { useCounter } from '../counter-state';
import { DocumentDialog } from './document-dialog';

vi.mock('@/app/queries/identity-access/useCurrentUser', () => ({
  useCurrentUserQuery: vi.fn(),
}));
vi.mock('../counter-state', () => ({ useCounter: vi.fn() }));

const currentUserQuery = vi.mocked(useCurrentUserQuery);
const counter = vi.mocked(useCounter);

const txn: LedgerTxn = {
  id: 'txn-1',
  vat: 5,
  time: '10:30',
  total: 105,
  taxable: 100,
  type: 'INVOICE',
  number: 'INV-1001',
  shiftNo: 4,
  patientMrn: 'MRN-1001',
  payerShare: 0,
  patientName: 'Meera Nair',
  outstanding: 0,
  patientPaid: 105,
  description: 'Consultation',
  lines: [],
  approvedBy: null,
  discountReason: null,
  discountApprovedBy: null,
  payerAuthNumber: null,
  tenders: [
    {
      bank: '',
      details: {},
      amount: 105,
      change: 0,
      reference: '',
      method: 'CASH',
      tendered: 105,
    },
  ],
  reason: null,
  against: null,
  refundOfInvoice: null,
  visitNumber: 'VIS-1001',
  receiptNumber: 'RCP-1001',
};

beforeEach(() => {
  currentUserQuery.mockReturnValue({
    data: {
      tenant: { name: 'Dhathri Ayurvedic' },
    },
  } as never);
  counter.mockReturnValue({
    state: { advanceBalances: { 'MRN-1001': 25 } },
    patientByMrn: vi.fn(() => ({ phone: '+971500000000' })),
  } as never);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Billing Counter document dialog', () => {
  it('should use the active Tenant and transaction instead of demo clinic details', () => {
    render(createElement(DocumentDialog, { txn, onClose: vi.fn() }));

    expect(screen.getAllByText('Dhathri Ayurvedic').length).toBeGreaterThan(0);
    expect(screen.getByText('Medical EMR · Billing Counter')).toBeTruthy();
    expect(screen.getByText('Meera Nair')).toBeTruthy();
    expect(screen.getByText('MRN MRN-1001')).toBeTruthy();
    expect(screen.getByText('Receipt no.')).toBeTruthy();
    expect(screen.getByText('RCP-1001')).toBeTruthy();
    expect(screen.getByText('Thank you for choosing Dhathri Ayurvedic.')).toBeTruthy();

    expect(screen.queryByText('Al Ameen Ayurveda Clinic L.L.C.')).toBeNull();
    expect(screen.queryByText('Office 304, Al Bateen Tower, Abu Dhabi, UAE')).toBeNull();
    expect(screen.queryByText('100234567800003')).toBeNull();
  });
});
