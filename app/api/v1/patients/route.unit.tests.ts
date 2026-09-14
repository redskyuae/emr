import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPatientsQuery } from '@/app/api/lib/modules/patient/queries/get-patients-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/modules/patient/queries/get-patients-query', () => ({
  getPatientsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
}));

const getPatients = vi.mocked(getPatientsQuery);
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
