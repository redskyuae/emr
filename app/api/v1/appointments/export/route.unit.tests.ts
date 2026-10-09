import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';

import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAppointmentExport } from '@/app/api/lib/modules/appointment/export/appointment-export';
import { getAppointmentsQuery } from '@/app/api/lib/modules/appointment/queries/get-appointments-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';
import { GET } from './route';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
vi.mock('@/app/api/lib/modules/appointment/export/appointment-export', () => ({
  createAppointmentExport: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/appointment/queries/get-appointments-query', () => ({
  getAppointmentsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
}));
vi.mock('@/components/brand/brand-config', () => ({
  brandLogos: {
    'dhathri-ayurvedic': {
      name: 'Dhathri Ayurvedic',
      subtitle: 'Medical Centre',
      markSrc: '/brand/dhathri-ayurvedic-mark.png',
    },
    'dhathri-gram': {
      name: 'Dhathri Gram',
      subtitle: 'Ayurveda Medical Centre',
      markSrc: '/brand/dhathri-gram-mark.png',
    },
  },
  getConfiguredBrandLogoVariant: vi.fn(),
}));

const createExport = vi.mocked(createAppointmentExport);
const getAppointments = vi.mocked(getAppointmentsQuery);
const requireSession = vi.mocked(requireTenantSession);
const configuredBrand = vi.mocked(getConfiguredBrandLogoVariant);
const readLogo = vi.mocked(readFile);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'admin-1' } },
};

function request(search = '') {
  return new NextRequest(`http://localhost/api/v1/appointments/export${search}`);
}

describe('Appointment export route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    configuredBrand.mockReturnValue('dhathri-gram');
    readLogo.mockResolvedValue(Buffer.from([1, 2, 3]));
    getAppointments.mockResolvedValue({
      success: true,
      data: [
        {
          id: 10,
          slotDate: '2026-10-08',
          doctor: { id: 3, name: 'Dr. Meera' },
          therapist: { id: 8, name: 'Leela Krishnan' },
          patient: { id: 5, firstName: 'Asha', lastName: 'Rao', mrn: 'MRN-1001' },
          appointmentStatus: { id: 9, name: 'Scheduled', category: 'scheduled' },
        },
      ] as never,
      total: 1,
    });
    createExport.mockResolvedValue({
      body: new Uint8Array([11, 22, 33]),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'appointments-2026-10-08.xlsx',
    });
  });

  it('should return an auth response without querying Appointments', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(request('?format=excel'));

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(getAppointments).not.toHaveBeenCalled();
  });

  it('should reject an unsupported export format', async () => {
    const response = await GET(request('?format=csv'));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['Export format must be excel or pdf'],
    });
    expect(getAppointments).not.toHaveBeenCalled();
  });

  it('should generate a branded Excel attachment from the supplied filters', async () => {
    const response = await GET(
      request(
        '?format=excel&slotDate=08-10-2026&doctorId=3&therapistId=8&appointmentStatusId=9&query=rao'
      )
    );

    expect(getAppointments).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      filters: {
        slotDate: '08-10-2026',
        doctorId: '3',
        therapistId: '8',
        patientId: undefined,
        appointmentStatusId: '9',
        query: 'rao',
        page: 1,
        limit: 999,
      },
    });
    expect(createExport).toHaveBeenCalledWith(
      'excel',
      expect.arrayContaining([expect.objectContaining({ id: 10 })]),
      '08-10-2026',
      'Doctor Dr. Meera · Therapist Leela Krishnan · Status Scheduled · Search "rao"',
      {
        organizationName: 'Dhathri Gram',
        organizationSubtitle: 'Ayurveda Medical Centre',
        logo: Buffer.from([1, 2, 3]),
      }
    );
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="appointments-2026-10-08.xlsx"'
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([11, 22, 33]));
  });

  it('should generate a PDF attachment with fallback branding', async () => {
    configuredBrand.mockReturnValue('none');
    createExport.mockResolvedValue({
      body: new Uint8Array([37, 80, 68, 70]),
      contentType: 'application/pdf',
      filename: 'appointments-2026-10-08.pdf',
    });

    const response = await GET(request('?format=pdf&slotDate=08-10-2026'));

    expect(readLogo).not.toHaveBeenCalled();
    expect(createExport).toHaveBeenCalledWith('pdf', expect.any(Array), '08-10-2026', 'none', {
      organizationName: 'Medical EMR',
      organizationSubtitle: 'Redsky Consultancy',
    });
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="appointments-2026-10-08.pdf"'
    );
  });

  it('should omit cancelled and no-show Appointments from the exported day schedule', async () => {
    getAppointments.mockResolvedValue({
      success: true,
      data: [
        { id: 1, appointmentStatus: { category: 'scheduled' } },
        { id: 2, appointmentStatus: { category: 'completed' } },
        { id: 3, appointmentStatus: { category: 'cancelled' } },
        { id: 4, appointmentStatus: { category: 'no_show' } },
      ] as never,
      total: 4,
    });

    await GET(request('?format=pdf&slotDate=08-10-2026'));

    expect(createExport).toHaveBeenCalledWith(
      'pdf',
      [expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })],
      '08-10-2026',
      'none',
      expect.any(Object)
    );
  });

  it('should reject an export when the matching Appointments exceed the fetched page', async () => {
    getAppointments.mockResolvedValue({
      success: true,
      data: Array.from({ length: 999 }, (_, index) => ({
        id: index + 1,
        appointmentStatus: { category: 'scheduled' },
      })) as never,
      total: 1_000,
    });

    const response = await GET(request('?format=excel&slotDate=08-10-2026'));

    expect(response.status).toBe(StatusCodes.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      message: 'Conflict',
      errors: ['Too many Appointments to export (1000). Narrow the filters.'],
    });
    expect(readLogo).not.toHaveBeenCalled();
    expect(createExport).not.toHaveBeenCalled();
  });

  it('should return validation errors without generating a file', async () => {
    getAppointments.mockResolvedValue({
      success: false,
      errors: ['Therapist ID must be a positive integer'],
      status: StatusCodes.BAD_REQUEST,
    });

    const response = await GET(request('?format=pdf&therapistId=nope'));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(createExport).not.toHaveBeenCalled();
  });

  it('should return an internal error when file generation fails', async () => {
    createExport.mockRejectedValue(new Error('render failed'));

    const response = await GET(request('?format=pdf&slotDate=08-10-2026'));

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({ message: 'Internal Server Error' });
  });
});
