import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPatientTimelineQuery } from '@/app/api/lib/modules/patient-timeline/queries/get-patient-timeline-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/modules/patient-timeline/queries/get-patient-timeline-query', () => ({
  getPatientTimelineQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const getTimeline = vi.mocked(getPatientTimelineQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const timeline = { data: [], nextCursor: null };

function request(query = '?feed=all&limit=20') {
  return new NextRequest(`http://localhost/api/v1/patients/7/timeline${query}`);
}

function context(id = '7') {
  return { params: Promise.resolve({ id }) };
}

describe('Patient Timeline route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    getTimeline.mockResolvedValue({ success: true, data: timeline } as never);
  });

  it('should return unauthorized without checking permission', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(getTimeline).not.toHaveBeenCalled();
  });

  it('should return forbidden without reading the timeline when patient-timeline:read is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
    expect(getTimeline).not.toHaveBeenCalled();
  });

  it('should require patient-timeline:read and return the Patient Timeline', async () => {
    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual(timeline);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['patient-timeline:read']);
    expect(getTimeline).toHaveBeenCalledWith('7', 'tenant-1', {
      feed: 'all',
      limit: '20',
      cursor: undefined,
    });
  });
});
