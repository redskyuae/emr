import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/create-appointment-command';
import { getAppointmentsQuery } from '@/app/api/lib/modules/appointment/queries/get-appointments-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, POST } from './route';

vi.mock('@/app/api/lib/modules/appointment/commands/create-appointment-command', () => ({
  createAppointmentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/appointment/queries/get-appointments-query', () => ({
  getAppointmentsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
}));

const createAppointment = vi.mocked(createAppointmentCommand);
const getAppointments = vi.mocked(getAppointmentsQuery);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'admin-1' } },
};

const payload = {
  doctorId: 1,
  appointmentModeId: 2,
  appointmentTypeId: 3,
  appointmentReasonId: 4,
  patientId: 5,
  slotDate: '31-12-2099',
  doctorRotaId: 6,
  slotTimes: ['09:00'],
};

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function getRequest(search = '') {
  return new NextRequest(`http://localhost/api/v1/appointments${search}`);
}

describe('Appointments route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    createAppointment.mockResolvedValue({
      success: true,
      data: {
        id: 10,
        tenantId: 'tenant-1',
        bookingNumber: 'APT-1001',
        slotDate: '31-12-2099',
        rotaName: 'Morning',
        remarks: null,
        createdOn: new Date('2099-12-01T00:00:00.000Z'),
        doctor: { id: 1, name: 'Dr. Meera' },
        patient: {
          id: 5,
          mrn: 'MRN-1001',
          firstName: 'Asha',
          lastName: 'Rao',
          phone: '9876543210',
          registrationStatus: 'registered',
        },
        appointmentMode: { id: 2, name: 'In-person', code: 'INP' },
        appointmentType: { id: 3, name: 'Consultation', code: 'CONS' },
        appointmentReason: { id: 4, name: 'Follow-up', code: 'FUP' },
        appointmentStatus: { id: 7, name: 'Scheduled', code: 'SCH', category: 'scheduled' },
        slots: [{ slotTime: '09:00', status: 'Booked' }],
      },
    });
    getAppointments.mockResolvedValue({
      success: true,
      data: [
        {
          id: 10,
          tenantId: 'tenant-1',
          bookingNumber: 'APT-1001',
          slotDate: '31-12-2099',
          rotaName: 'Morning',
          remarks: null,
          createdOn: new Date('2099-12-01T00:00:00.000Z'),
          doctor: { id: 1, name: 'Dr. Meera' },
          patient: {
            id: 5,
            mrn: 'MRN-1001',
            firstName: 'Asha',
            lastName: 'Rao',
            phone: '9876543210',
            registrationStatus: 'registered',
          },
          appointmentMode: { id: 2, name: 'In-person', code: 'INP' },
          appointmentType: { id: 3, name: 'Consultation', code: 'CONS' },
          appointmentReason: { id: 4, name: 'Follow-up', code: 'FUP' },
          appointmentStatus: { id: 7, name: 'Scheduled', code: 'SCH', category: 'scheduled' },
          slots: [{ slotTime: '09:00', status: 'Booked' }],
        },
      ],
      total: 1,
    });
  });

  describe('GET', () => {
    it('should return an auth response without calling the query', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
      );

      const response = await GET(getRequest());

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(getAppointments).not.toHaveBeenCalled();
    });

    it('should parse the filter query parameters', async () => {
      await GET(getRequest('?slotDate=16-07-2026&doctorId=3&appointmentStatusId=9&query=rao'));

      expect(getAppointments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: {
          slotDate: '16-07-2026',
          doctorId: '3',
          patientId: undefined,
          appointmentStatusId: '9',
          query: 'rao',
          page: 1,
          limit: 10,
        },
      });
    });

    it('should treat blank filters as absent so the query can default the date', async () => {
      await GET(getRequest('?slotDate=&doctorId=&appointmentStatusId='));

      expect(getAppointments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: expect.objectContaining({
          slotDate: undefined,
          doctorId: undefined,
          appointmentStatusId: undefined,
        }),
      });
    });

    it('should accept search as an alias for query', async () => {
      await GET(getRequest('?search=asha'));

      expect(getAppointments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: expect.objectContaining({ query: 'asha' }),
      });
    });

    it('should clamp paging parameters', async () => {
      await GET(getRequest('?page=0&limit=5000'));

      expect(getAppointments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        filters: expect.objectContaining({ page: 1, limit: 999 }),
      });
    });

    it('should return the paginated envelope', async () => {
      const response = await GET(getRequest('?limit=10'));

      expect(response.status).toBe(StatusCodes.OK);
      await expect(response.json()).resolves.toMatchObject({
        data: [{ id: 10, bookingNumber: 'APT-1001' }],
        meta: { total: 1, totalPages: 1, pageSize: 10, pageNumber: 1 },
      });
    });

    it('should report zero total pages when there are no Appointments', async () => {
      getAppointments.mockResolvedValue({ success: true, data: [], total: 0 });

      const response = await GET(getRequest());

      await expect(response.json()).resolves.toMatchObject({ meta: { totalPages: 0 } });
    });

    it('should map a query validation failure to 400', async () => {
      getAppointments.mockResolvedValue({
        success: false,
        errors: ['Appointment status ID must be positive'],
      });

      const response = await GET(getRequest('?appointmentStatusId=0'));

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toMatchObject({
        errors: ['Appointment status ID must be positive'],
      });
    });
  });

  describe('POST', () => {
    it('should return an auth response without reading the request body', async () => {
      requireSession.mockResolvedValue(
        NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
      );

      const response = await POST(jsonRequest(payload));

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(createAppointment).not.toHaveBeenCalled();
    });

    it('should reject invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/v1/appointments', {
        method: 'POST',
        body: '{',
      });

      const response = await POST(request);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      await expect(response.json()).resolves.toEqual({
        message: 'Request body must be valid JSON',
      });
    });

    it('should call the command with parsed body and tenant id', async () => {
      const response = await POST(jsonRequest(payload));

      expect(response.status).toBe(StatusCodes.CREATED);
      expect(createAppointment).toHaveBeenCalledWith(payload, 'tenant-1');
      await expect(response.json()).resolves.toMatchObject({
        data: { id: 10, bookingNumber: 'APT-1001' },
      });
    });

    it('should include patient matches on conflict responses', async () => {
      const patientMatches = [
        {
          id: 8,
          mrn: 'MRN-1008',
          firstName: 'Asha',
          lastName: 'Rao',
          phone: '9876543210',
          isActive: true,
          registrationStatus: 'registered' as const,
        },
      ];
      createAppointment.mockResolvedValue({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Potential Patient match found. Retry with patientId.'],
        patientMatches,
      });

      const response = await POST(jsonRequest(payload));

      expect(response.status).toBe(StatusCodes.CONFLICT);
      await expect(response.json()).resolves.toEqual({
        message: 'Conflict',
        errors: ['Potential Patient match found. Retry with patientId.'],
        patientMatches,
      });
    });
  });
});
