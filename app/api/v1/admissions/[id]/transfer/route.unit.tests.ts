import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordServerEventAfterLookup } from '@/app/api/lib/analytics/server-analytics';
import { transferBedCommand } from '@/app/api/lib/modules/admission/commands/transfer-bed-command';
import { getBedByIdQuery } from '@/app/api/lib/modules/bed/queries/get-bed-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user-1', tenantId: 'tenant-1' })),
  recordServerEventAfterLookup: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/admission/commands/transfer-bed-command', () => ({
  transferBedCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/bed/queries/get-bed-by-id-query', () => ({
  getBedByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const transferBed = vi.mocked(transferBedCommand);
const getBed = vi.mocked(getBedByIdQuery);
const recordAfterLookup = vi.mocked(recordServerEventAfterLookup);

const context = { params: Promise.resolve({ id: '1' }) };
const admission = { id: 1, ward: { id: 6, name: 'ICU', code: 'ICU' } };

function request() {
  return new NextRequest('http://localhost/api/v1/admissions/1/transfer', {
    method: 'POST',
    body: JSON.stringify({ bedId: 4 }),
  });
}

describe('Bed Transfer route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireTenantSession).mockResolvedValue({
      tenantId: 'tenant-1',
      session: { user: { id: 'user-1' } },
    } as never);
  });

  it('should respond before reading the Ward of the Bed left', async () => {
    transferBed.mockResolvedValue({ success: true, data: admission, fromBedId: 3 } as never);
    getBed.mockResolvedValue({ success: true, data: { id: 3, wardId: 6 } } as never);

    const response = await POST(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(getBed).not.toHaveBeenCalled();
    const [, event, lookup] = recordAfterLookup.mock.calls[0];
    expect(event).toBe('bed_transferred');
    await expect(lookup()).resolves.toEqual({ same_ward: true });
    expect(getBed).toHaveBeenCalledWith(3, 'tenant-1');
  });

  it('should report a move to another Ward, and record nothing when the Bed cannot be read', async () => {
    transferBed.mockResolvedValue({ success: true, data: admission, fromBedId: 3 } as never);
    getBed.mockResolvedValueOnce({ success: true, data: { id: 3, wardId: 9 } } as never);
    getBed.mockResolvedValueOnce({ success: false, errors: ['Bed not found'] } as never);

    await POST(request(), context);
    const [, , lookup] = recordAfterLookup.mock.calls[0];

    await expect(lookup()).resolves.toEqual({ same_ward: false });
    await expect(lookup()).resolves.toBeNull();
  });

  it('should record nothing when the transfer is rejected', async () => {
    transferBed.mockResolvedValue({
      success: false,
      errors: ['Bed is not available for admission.'],
      status: StatusCodes.CONFLICT,
    });

    const response = await POST(request(), context);

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(recordAfterLookup).not.toHaveBeenCalled();
  });
});
