import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invoiceRepository } from '../repository/invoice-repository';
import { getInvoiceByIdQuery } from './get-invoice-by-id-query';
import { getInvoicesQuery } from './get-invoices-query';

vi.mock('../repository/invoice-repository', () => ({
  invoiceRepository: { getInvoiceById: vi.fn(), getInvoices: vi.fn() },
}));

const repo = vi.mocked(invoiceRepository);
const invoice = { id: 1, invoiceNumber: 'INV-1001' } as never;

beforeEach(() => {
  vi.clearAllMocks();
  repo.getInvoiceById.mockResolvedValue(invoice);
  repo.getInvoices.mockResolvedValue({ data: [invoice], total: 1 });
});

describe('Invoice queries', () => {
  describe('getInvoiceByIdQuery', () => {
    it('should short-circuit on an invalid id', async () => {
      await expect(getInvoiceByIdQuery('abc', 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Invoice abc is Invalid.'],
      });
      expect(repo.getInvoiceById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getInvoiceById.mockResolvedValue(undefined);

      await expect(getInvoiceByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the invoice on success', async () => {
      await expect(getInvoiceByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: invoice,
      });
      expect(repo.getInvoiceById).toHaveBeenCalledWith('tenant-1', 1);
    });
  });

  describe('getInvoicesQuery', () => {
    it('should short-circuit on a blank tenant id', async () => {
      const result = await getInvoicesQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getInvoices).not.toHaveBeenCalled();
    });

    it('should short-circuit on an unknown status filter', async () => {
      const result = await getInvoicesQuery({ tenantId: 'tenant-1', status: 'ARCHIVED' });

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice status ARCHIVED is Invalid.'],
      });
      expect(repo.getInvoices).not.toHaveBeenCalled();
    });

    it('should pass a parsed status set and paging through to the repository', async () => {
      await getInvoicesQuery({
        tenantId: 'tenant-1',
        status: 'DRAFT,FINALIZED',
        page: 2,
        limit: 5,
        query: 'INV',
        patientId: 7,
      });

      expect(repo.getInvoices).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        statuses: ['DRAFT', 'FINALIZED'],
        patientId: 7,
        page: 2,
        limit: 5,
        query: 'INV',
      });
    });

    it('should return the list query result shape', async () => {
      await expect(getInvoicesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [invoice],
        total: 1,
      });
    });
  });
});
