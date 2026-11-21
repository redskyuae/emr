import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { createPatientCommand } from '@/app/api/lib/modules/patient/commands/create-patient-command';
import { getPatientsQuery } from '@/app/api/lib/modules/patient/queries/get-patients-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, POST } from './route';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/patient/commands/create-patient-command', () => ({
  createPatientCommand: vi.fn(),
}));

vi.mock('@/app/api/lib/modules/patient/queries/get-patients-query', () => ({
  getPatientsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
}));

const getPatients = vi.mocked(getPatientsQuery);
const createPatient = vi.mocked(createPatientCommand);
const recordEvent = vi.mocked(recordLifecycleEvent);
const requireSession = vi.mocked(requireTenantSession);

describe('Patients route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({
      tenantId: 'tenant-1',
      session: { user: { id: 'admin-1' } },
    } as never);
    getPatients.mockResolvedValue({ success: true, data: [], total: 0 });
  });

  it('should parse the Patient registration status filter', async () => {
    const request = new NextRequest(
      'http://localhost/api/v1/patients?registrationStatus=registered'
    );

    await GET(request);

    expect(getPatients).toHaveBeenCalledWith(
      expect.objectContaining({ registrationStatus: 'registered' })
    );
  });

  it('should ignore an invalid Patient registration status filter', async () => {
    const request = new NextRequest('http://localhost/api/v1/patients?registrationStatus=unknown');

    await GET(request);

    expect(getPatients).toHaveBeenCalledWith(
      expect.objectContaining({ registrationStatus: undefined })
    );
  });
});

describe('Register Patient route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({
      tenantId: 'tenant-1',
      session: { user: { id: 'admin-1' } },
    } as never);
  });

  function postRequest() {
    return new NextRequest('http://localhost/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Aisha' }),
    });
  }

  it('should record a direct patient_registered for a created Registered Patient', async () => {
    createPatient.mockResolvedValue({
      success: true,
      data: {
        id: 9,
        registrationStatus: 'registered',
        emiratesId: null,
        isMedicalTourist: true,
        identityDocuments: [{ id: 1 }],
      } as never,
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(201);
    expect(recordEvent).toHaveBeenCalledTimes(1);
    const [, , event, buildProperties] = recordEvent.mock.calls[0];
    expect(event).toBe('patient_registered');
    expect(buildProperties()).toEqual({
      registration_path: 'direct',
      has_emirates_id: false,
      is_medical_tourist: true,
      identity_document_count: 1,
    });
  });

  it('should record nothing when registration is rejected', async () => {
    createPatient.mockResolvedValue({ success: false, errors: ['First name is required'] });

    const response = await POST(postRequest());

    expect(response.status).toBe(400);
    expect(recordEvent).not.toHaveBeenCalled();
  });
});
