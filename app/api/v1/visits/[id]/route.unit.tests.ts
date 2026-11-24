import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { updateVisitCommand } from '@/app/api/lib/modules/visit/commands/update-visit-command';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/visit/commands/delete-visit-command', () => ({
  deleteVisitCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/commands/update-visit-command', () => ({
  updateVisitCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/visit/queries/get-visit-by-id-query', () => ({
  getVisitByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const requireSession = vi.mocked(requireTenantSession);
const getVisit = vi.mocked(getVisitByIdQuery);
const updateVisit = vi.mocked(updateVisitCommand);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '42' }) };
const visit = {
  id: 42,
  visitNumber: 'VST-1042',
  patient: { id: 9 },
  doctor: { id: 3, name: 'Dr. Sara Ali' },
  chiefComplaint: 'Lower back pain',
  status: 'in_progress',
} as unknown as Visit;

function request() {
  return new NextRequest('http://localhost/api/v1/visits/42', {
    method: 'PUT',
    body: JSON.stringify({ chiefComplaint: 'Neck pain' }),
  });
}

describe('Update Visit route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    getVisit.mockResolvedValue({ success: true, data: visit });
    updateVisit.mockResolvedValue({
      success: true,
      data: { ...visit, chiefComplaint: 'Neck pain', doctor: { id: 4, name: 'Dr. Omar Haddad' } },
    } as never);
  });

  it('should read the Visit before updating and record the changed fields', async () => {
    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(getVisit.mock.invocationCallOrder[0]).toBeLessThan(
      updateVisit.mock.invocationCallOrder[0]
    );
    expect(recordAudit).toHaveBeenCalledWith(tenantSession, expect.anything(), 'visit.update', {
      entityId: 42,
      visitId: 42,
      patientId: 9,
      entityLabel: 'VST-1042',
      changes: [
        { field: 'doctor.name', label: 'Doctor', from: 'Dr. Sara Ali', to: 'Dr. Omar Haddad' },
        {
          field: 'chiefComplaint',
          label: 'Chief complaint',
          from: 'Lower back pain',
          to: 'Neck pain',
        },
      ],
    });
  });

  it('should record no changes when the Visit could not be read first', async () => {
    getVisit.mockResolvedValue({ success: false, errors: ['Visit not found'] });

    await PUT(request(), context);

    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'visit.update',
      expect.objectContaining({ changes: null })
    );
  });
});
