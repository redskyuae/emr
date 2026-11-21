import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateAmendVisitClinicalNote } from '../validator/amend-visit-clinical-note-validator';
import { amendVisitClinicalNoteCommand } from './amend-visit-clinical-note-command';

vi.mock('../repository/clinical-note-repository', () => ({
  clinicalNoteRepository: { amendClinicalNote: vi.fn() },
}));
vi.mock('../validator/amend-visit-clinical-note-validator', () => ({
  validateAmendVisitClinicalNote: vi.fn(),
}));

const repo = vi.mocked(clinicalNoteRepository);
const validateAmend = vi.mocked(validateAmendVisitClinicalNote);

const payload = {
  noteTypeId: 2,
  subjective: undefined,
  objective: undefined,
  assessment: 'Vata imbalance',
  plan: undefined,
};
const amendedNote = { id: 4, visitId: 1, status: 'signed' } as ClinicalNote;
const visitCompletedAt = new Date('2026-07-15T11:00:00.000Z');

describe('amendVisitClinicalNoteCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAmend.mockResolvedValue({ success: true, data: { id: 4, payload, visitCompletedAt } });
    repo.amendClinicalNote.mockResolvedValue(amendedNote);
  });

  it('should validate first with the raw ids, payload, and Tenant', async () => {
    await amendVisitClinicalNoteCommand('1', '4', 'tenant-1', { noteTypeId: 2 }, 'user-9');

    expect(validateAmend).toHaveBeenCalledWith('1', '4', { noteTypeId: 2 }, 'tenant-1');
  });

  it('should return the validation failure and not write', async () => {
    validateAmend.mockResolvedValue({
      success: false,
      errors: ['Clinical note not found'],
      status: StatusCodes.NOT_FOUND,
    });

    await expect(
      amendVisitClinicalNoteCommand('1', '4', 'tenant-1', {}, 'user-9')
    ).resolves.toEqual({
      success: false,
      errors: ['Clinical note not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(repo.amendClinicalNote).not.toHaveBeenCalled();
  });

  it('should update only the note type and sections and record the amending user', async () => {
    await expect(
      amendVisitClinicalNoteCommand('1', '4', 'tenant-1', {}, 'user-9')
    ).resolves.toEqual({
      success: true,
      data: amendedNote,
      visitCompletedAt,
    });
    expect(repo.amendClinicalNote).toHaveBeenCalledWith(
      4,
      { ...payload, tenantId: 'tenant-1' },
      'user-9'
    );

    const [, data] = repo.amendClinicalNote.mock.calls[0];
    expect(data).not.toHaveProperty('visitId');
    expect(data).not.toHaveProperty('admissionId');
  });

  it('should return not found when the note disappears before the write', async () => {
    repo.amendClinicalNote.mockResolvedValue(undefined);

    await expect(
      amendVisitClinicalNoteCommand('1', '4', 'tenant-1', {}, 'user-9')
    ).resolves.toEqual({
      success: false,
      errors: ['Clinical note not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });
});
