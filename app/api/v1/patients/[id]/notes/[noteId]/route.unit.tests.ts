import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { updateClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/update-clinical-note-command';
import { getClinicalNoteByIdQuery } from '@/app/api/lib/modules/clinical-note/queries/get-clinical-note-by-id-query';
import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/clinical-note/commands/delete-clinical-note-command', () => ({
  deleteClinicalNoteCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/clinical-note/commands/update-clinical-note-command', () => ({
  updateClinicalNoteCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/clinical-note/queries/get-clinical-note-by-id-query', () => ({
  getClinicalNoteByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const requireSession = vi.mocked(requireTenantSession);
const getNote = vi.mocked(getClinicalNoteByIdQuery);
const updateNote = vi.mocked(updateClinicalNoteCommand);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const context = { params: Promise.resolve({ id: '9', noteId: '15' }) };
const note = {
  id: 15,
  patientId: 9,
  visitId: 42,
  noteTypeId: 2,
  subjective: 'Reports lower back pain',
  plan: 'Rest and review',
  status: 'draft',
} as unknown as ClinicalNote;

function request() {
  return new NextRequest('http://localhost/api/v1/patients/9/notes/15', {
    method: 'PUT',
    body: JSON.stringify({ plan: 'Physiotherapy twice weekly' }),
  });
}

describe('Update Clinical Note route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    getNote.mockResolvedValue({ success: true, data: note });
    updateNote.mockResolvedValue({
      success: true,
      data: { ...note, plan: 'Physiotherapy twice weekly' },
    } as never);
  });

  it('should record the fields changed from the note as it was before the update', async () => {
    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'clinical-note.update',
      {
        entityId: 15,
        visitId: 42,
        patientId: 9,
        changes: [
          {
            field: 'plan',
            label: 'Plan',
            from: 'Rest and review',
            to: 'Physiotherapy twice weekly',
          },
        ],
      }
    );
  });

  it('should not update or record a note that belongs to another Patient', async () => {
    getNote.mockResolvedValue({ success: true, data: { ...note, patientId: 10 } });

    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(updateNote).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
