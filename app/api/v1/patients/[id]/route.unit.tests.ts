import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { updatePatientCommand } from '@/app/api/lib/modules/patient/commands/update-patient-command';
import { getPatientByIdQuery } from '@/app/api/lib/modules/patient/queries/get-patient-by-id-query';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, PUT } from './route';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/patient/queries/get-patient-by-id-query', () => ({
  getPatientByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/patient/commands/update-patient-command', () => ({
  updatePatientCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const updatePatient = vi.mocked(updatePatientCommand);
const requireSession = vi.mocked(requireTenantSession);
const recordEvent = vi.mocked(recordLifecycleEvent);
const recordAudit = vi.mocked(recordAuditEvent);
const getPatientById = vi.mocked(getPatientByIdQuery);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '9' }) };
const patient = {
  id: 9,
  mrn: 'MRN-0009',
  phone: '+971501234567',
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
    getPatientById.mockResolvedValue({ success: true, data: patient });
  });

  it('should record a patient.update Audit Event with the changed fields', async () => {
    getPatientById.mockResolvedValue({
      success: true,
      data: { ...patient, phone: '+971500000000' },
    });
    updatePatient.mockResolvedValue({
      success: true,
      data: patient,
      previousRegistrationStatus: 'registered',
    });

    await PUT(request(), context);

    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'patient.update',
      expect.objectContaining({
        entityId: 9,
        patientId: 9,
        entityLabel: 'MRN-0009',
        changes: [{ field: 'phone', label: 'Phone', from: '+971500000000', to: '+971501234567' }],
      })
    );
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
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

describe('Get Patient route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
  });

  it('should record a patient.view Audit Event when the Patient is opened', async () => {
    getPatientById.mockResolvedValue({ success: true, data: patient });

    const response = await GET(new NextRequest('http://localhost/api/v1/patients/9'), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'patient.view',
      expect.objectContaining({ entityId: 9, patientId: 9, entityLabel: 'MRN-0009' })
    );
  });

  it('should record nothing when the Patient is not found', async () => {
    getPatientById.mockResolvedValue({
      success: false,
      errors: ['Patient not found'],
      status: StatusCodes.NOT_FOUND,
    });

    await GET(new NextRequest('http://localhost/api/v1/patients/9'), context);

    expect(recordAudit).not.toHaveBeenCalled();
  });
});
