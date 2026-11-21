import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { updatePatientCommand } from '@/app/api/lib/modules/patient/commands/update-patient-command';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/patient/commands/update-patient-command', () => ({
  updatePatientCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const updatePatient = vi.mocked(updatePatientCommand);
const requireSession = vi.mocked(requireTenantSession);
const recordEvent = vi.mocked(recordLifecycleEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '9' }) };
const patient = {
  id: 9,
  registrationStatus: 'registered',
  emiratesId: '784199012345671',
  isMedicalTourist: false,
  identityDocuments: [],
} as unknown as Patient;

function request() {
  return new NextRequest('http://localhost/api/v1/patients/9', {
    method: 'PUT',
    body: JSON.stringify({ firstName: 'Aisha' }),
  });
}

describe('Update Patient route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
  });

  it('should record patient_registered when the update completes a Provisional registration', async () => {
    updatePatient.mockResolvedValue({
      success: true,
      data: patient,
      previousRegistrationStatus: 'provisional',
    });

    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({ data: { ...patient } });
    expect(recordEvent).toHaveBeenCalledTimes(1);
    expect(recordEvent).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'patient_registered',
      expect.any(Function)
    );
    const [, , , buildProperties] = recordEvent.mock.calls[0];
    expect(buildProperties()).toEqual({
      registration_path: 'completed_provisional',
      has_emirates_id: true,
      is_medical_tourist: false,
      identity_document_count: 0,
    });
  });

  it('should record nothing when an already Registered Patient is updated', async () => {
    updatePatient.mockResolvedValue({
      success: true,
      data: patient,
      previousRegistrationStatus: 'registered',
    });

    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(recordEvent).not.toHaveBeenCalled();
  });

  it('should record nothing when the update is rejected', async () => {
    updatePatient.mockResolvedValue({
      success: false,
      errors: ['Patient not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(recordEvent).not.toHaveBeenCalled();
  });
});
