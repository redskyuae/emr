import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { amendVisitClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/amend-visit-clinical-note-command';
import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/modules/clinical-note/commands/amend-visit-clinical-note-command', () => ({
  amendVisitClinicalNoteCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const amendNote = vi.mocked(amendVisitClinicalNoteCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const note = { id: 4, visitId: 1, status: 'signed' } as ClinicalNote;
const body = { noteTypeId: 2, assessment: 'Vata imbalance' };

function request(rawBody = JSON.stringify(body)) {
  return new NextRequest('http://localhost/api/v1/visits/1/notes/4/amend', {
    method: 'PUT',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  });
}

function context(id = '1', noteId = '4') {
  return { params: Promise.resolve({ id, noteId }) };
}

describe('Visit Clinical Note amend route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    amendNote.mockResolvedValue({ success: true, data: note });
  });

  it('should return unauthorized without checking permission or amending', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(amendNote).not.toHaveBeenCalled();
  });

  it('should return forbidden without amending when visit:amend is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit:amend']);
    expect(amendNote).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON before amending', async () => {
    const response = await PUT(request('{'), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(amendNote).not.toHaveBeenCalled();
  });

  it('should pass the Visit id, note id, active Tenant, body, and amending user to the command', async () => {
    const response = await PUT(request(), context('7', '9'));

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toMatchObject({ data: { id: 4, status: 'signed' } });
    expect(amendNote).toHaveBeenCalledWith('7', '9', 'tenant-1', body, 'user-1');
  });

  it('should map validation failures to bad request', async () => {
    amendNote.mockResolvedValue({
      success: false,
      errors: ['Clinical note type 2 does not exist.'],
      status: StatusCodes.BAD_REQUEST,
    });

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['Clinical note type 2 does not exist.'],
    });
  });

  it.each(['Visit not found', 'Clinical note not found'])(
    'should map %s to not found with that message',
    async (error) => {
      amendNote.mockResolvedValue({
        success: false,
        errors: [error],
        status: StatusCodes.NOT_FOUND,
      });

      const response = await PUT(request(), context());

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      await expect(response.json()).resolves.toEqual({ message: error, errors: [error] });
    }
  );

  it('should map a Visit that is not Completed to conflict', async () => {
    amendNote.mockResolvedValue({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      message: 'Visit VST-1001 is not completed and cannot be amended.',
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
    });
  });

  it('should return an internal server error when the command throws', async () => {
    amendNote.mockRejectedValue(new Error('database down'));

    const response = await PUT(request(), context());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
