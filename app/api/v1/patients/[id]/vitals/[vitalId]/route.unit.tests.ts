import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { updatePatientVitalSignCommand } from '@/app/api/lib/modules/patient-vital-sign/commands/update-patient-vital-sign-command';
import { getPatientVitalSignByIdQuery } from '@/app/api/lib/modules/patient-vital-sign/queries/get-patient-vital-sign-by-id-query';
import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock(
  '@/app/api/lib/modules/patient-vital-sign/commands/delete-patient-vital-sign-command',
  () => ({ deletePatientVitalSignCommand: vi.fn() })
);
vi.mock(
  '@/app/api/lib/modules/patient-vital-sign/commands/update-patient-vital-sign-command',
  () => ({ updatePatientVitalSignCommand: vi.fn() })
);
vi.mock(
  '@/app/api/lib/modules/patient-vital-sign/queries/get-patient-vital-sign-by-id-query',
  () => ({ getPatientVitalSignByIdQuery: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const requireSession = vi.mocked(requireTenantSession);
const getVitalSign = vi.mocked(getPatientVitalSignByIdQuery);
const updateVitalSign = vi.mocked(updatePatientVitalSignCommand);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '9', vitalId: '21' }) };
const vitalSign = {
  id: 21,
  patientId: 9,
  visitId: 42,
  systolic: 120,
  diastolic: 80,
  pulseBpm: 72,
} as unknown as PatientVitalSign;

function request() {
  return new NextRequest('http://localhost/api/v1/patients/9/vitals/21', {
    method: 'PUT',
    body: JSON.stringify({ systolic: 135, pulseBpm: 88 }),
  });
}

describe('Update Vital Signs route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    getVitalSign.mockResolvedValue({ success: true, data: vitalSign });
    updateVitalSign.mockResolvedValue({
      success: true,
      data: { ...vitalSign, systolic: 135, pulseBpm: 88 },
    } as never);
  });

  it('should record the fields changed from the reading as it was before the update', async () => {
    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'vital-sign.update',
      {
        entityId: 21,
        visitId: 42,
        patientId: 9,
        changes: [
          { field: 'systolic', label: 'Systolic', from: 120, to: 135 },
          { field: 'pulseBpm', label: 'Pulse (bpm)', from: 72, to: 88 },
        ],
      }
    );
  });

  it('should not update or record a reading that belongs to another Patient', async () => {
    getVitalSign.mockResolvedValue({ success: true, data: { ...vitalSign, patientId: 10 } });

    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(updateVitalSign).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
