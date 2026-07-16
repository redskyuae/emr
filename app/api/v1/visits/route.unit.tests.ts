import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkInVisitCommand } from '@/app/api/lib/modules/visit/commands/check-in-visit-command';
import { getVisitsQuery } from '@/app/api/lib/modules/visit/queries/get-visits-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, POST } from './route';

vi.mock('@/app/api/lib/modules/visit/commands/check-in-visit-command', () => ({
  checkInVisitCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/queries/get-visits-query', () => ({
  getVisitsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const checkIn = vi.mocked(checkInVisitCommand);
const getVisits = vi.mocked(getVisitsQuery);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'admin-1' } } };
const visit = { id: 1, visitNumber: 'VST-1001', queueToken: 1 };

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/visits', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function getRequest(search = '') {
  return new NextRequest(`http://localhost/api/v1/visits${search}`);
}

describe('Visits route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    checkIn.mockResolvedValue({ success: true, data: visit as never });
    getVisits.mockResolvedValue({ success: true, data: [visit as never], total: 1 });
  });

  describe('POST', () => {
    it('should return the session response when the session is missing', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json(
          { message: 'Unauthorized' },
          { status: StatusCodes.UNAUTHORIZED }
        ) as never
      );

      const response = await POST(postRequest({}));

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(checkIn).not.toHaveBeenCalled();
    });

    it('should reject an invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/v1/visits', {
        method: 'POST',
        body: 'not-json',
      });

      const response = await POST(request);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toMatchObject({
        message: 'Request body must be valid JSON',
      });
      expect(checkIn).not.toHaveBeenCalled();
    });

    it('should pass an appointment check-in through to the command with the session tenant', async () => {
      await POST(postRequest({ appointmentId: 5, visitTypeId: 2 }));

      expect(checkIn).toHaveBeenCalledWith({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1');
    });

    it('should pass a walk-in check-in through to the command', async () => {
      await POST(postRequest({ patientId: 7, doctorId: 3, visitTypeId: 2 }));

      expect(checkIn).toHaveBeenCalledWith(
        { patientId: 7, doctorId: 3, visitTypeId: 2 },
        'tenant-1'
      );
    });

    it('should return 201 with the created visit', async () => {
      const response = await POST(postRequest({ appointmentId: 5, visitTypeId: 2 }));

      expect(response.status).toBe(StatusCodes.CREATED);
      await expect(response.json()).resolves.toEqual({ data: visit });
    });

    it('should surface a single conflict error as the message', async () => {
      checkIn.mockResolvedValue({
        success: false,
        errors: ['Patient 7 already has an active visit.'],
        status: StatusCodes.CONFLICT,
      });

      const response = await POST(postRequest({}));

      expect(response.status).toBe(StatusCodes.CONFLICT);
      await expect(response.json()).resolves.toEqual({
        message: 'Patient 7 already has an active visit.',
        errors: ['Patient 7 already has an active visit.'],
      });
    });

    it('should default a validation failure to 400', async () => {
      checkIn.mockResolvedValue({ success: false, errors: ['Visit type ID is required'] });

      const response = await POST(postRequest({}));

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toMatchObject({ message: 'Validation failed' });
    });

    it('should return 500 when the command throws', async () => {
      checkIn.mockRejectedValue(new Error('boom'));

      const response = await POST(postRequest({}));

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('GET', () => {
    it('should return the session response when the session is missing', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json(
          { message: 'Unauthorized' },
          { status: StatusCodes.UNAUTHORIZED }
        ) as never
      );

      const response = await GET(getRequest());

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(getVisits).not.toHaveBeenCalled();
    });

    it('should parse the filter query parameters', async () => {
      await GET(getRequest('?visitDate=16-07-2026&doctorId=3&status=CHECKED_IN&query=rao'));

      expect(getVisits).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: {
          visitDate: '16-07-2026',
          doctorId: '3',
          patientId: undefined,
          status: 'CHECKED_IN',
          query: 'rao',
          page: 1,
          limit: 10,
        },
      });
    });

    it('should treat blank filters as absent so the query can default the date', async () => {
      await GET(getRequest('?visitDate=&doctorId='));

      expect(getVisits).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: expect.objectContaining({ visitDate: undefined, doctorId: undefined }),
      });
    });

    it('should accept search as an alias for query', async () => {
      await GET(getRequest('?search=asha'));

      expect(getVisits).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: expect.objectContaining({ query: 'asha' }),
      });
    });

    it('should clamp paging parameters', async () => {
      await GET(getRequest('?page=0&limit=5000'));

      expect(getVisits).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: expect.objectContaining({ page: 1, limit: 999 }),
      });
    });

    it('should return the paginated envelope', async () => {
      const response = await GET(getRequest('?limit=10'));

      expect(response.status).toBe(StatusCodes.OK);
      await expect(response.json()).resolves.toEqual({
        data: [visit],
        meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
      });
    });

    it('should report zero total pages when there are no visits', async () => {
      getVisits.mockResolvedValue({ success: true, data: [], total: 0 });

      const response = await GET(getRequest());

      await expect(response.json()).resolves.toMatchObject({ meta: { totalPages: 0 } });
    });

    it('should map a query validation failure to 400', async () => {
      getVisits.mockResolvedValue({ success: false, errors: ['Status is Invalid.'] });

      const response = await GET(getRequest('?status=NOPE'));

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toMatchObject({ errors: ['Status is Invalid.'] });
    });
  });
});
