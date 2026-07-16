import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import { validateCreateClinicalNote } from '../validator/create-clinical-note-validator';
import { validateUpdateClinicalNote } from '../validator/update-clinical-note-validator';
import { validateSignClinicalNote } from '../validator/sign-clinical-note-validator';
import { validateDeleteClinicalNote } from '../validator/delete-clinical-note-validator';
import { createClinicalNoteCommand } from './create-clinical-note-command';
import { updateClinicalNoteCommand } from './update-clinical-note-command';
import { signClinicalNoteCommand } from './sign-clinical-note-command';
import { deleteClinicalNoteCommand } from './delete-clinical-note-command';

vi.mock('../repository/clinical-note-repository', () => ({
  clinicalNoteRepository: {
    createClinicalNote: vi.fn(),
    updateClinicalNote: vi.fn(),
    signClinicalNote: vi.fn(),
    deleteClinicalNote: vi.fn(),
  },
}));
vi.mock('../validator/create-clinical-note-validator', () => ({
  validateCreateClinicalNote: vi.fn(),
}));
vi.mock('../validator/update-clinical-note-validator', () => ({
  validateUpdateClinicalNote: vi.fn(),
}));
vi.mock('../validator/sign-clinical-note-validator', () => ({
  validateSignClinicalNote: vi.fn(),
}));
vi.mock('../validator/delete-clinical-note-validator', () => ({
  validateDeleteClinicalNote: vi.fn(),
}));

const repo = clinicalNoteRepository as typeof clinicalNoteRepository & {
  createClinicalNote: Mock<typeof clinicalNoteRepository.createClinicalNote>;
  updateClinicalNote: Mock<typeof clinicalNoteRepository.updateClinicalNote>;
  signClinicalNote: Mock<typeof clinicalNoteRepository.signClinicalNote>;
  deleteClinicalNote: Mock<typeof clinicalNoteRepository.deleteClinicalNote>;
};
const validateCreate = validateCreateClinicalNote as Mock<typeof validateCreateClinicalNote>;
const validateUpdate = validateUpdateClinicalNote as Mock<typeof validateUpdateClinicalNote>;
const validateSign = validateSignClinicalNote as Mock<typeof validateSignClinicalNote>;
const validateDelete = validateDeleteClinicalNote as Mock<typeof validateDeleteClinicalNote>;
const note = { id: 4, patientId: 1, status: 'draft' } as never;
const signedNote = { id: 4, patientId: 1, status: 'signed' } as never;

describe('ClinicalNote commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { patientId: 1, payload: { noteTypeId: 2, subjective: 'Cough' } },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 4, payload: { noteTypeId: 2, subjective: 'Cough' } },
    });
    validateSign.mockResolvedValue({ success: true, data: { id: 4, tenantId: 'tenant-1' } });
    validateDelete.mockReturnValue({ success: true, data: { id: 4, tenantId: 'tenant-1' } });
    repo.createClinicalNote.mockResolvedValue(note);
    repo.updateClinicalNote.mockResolvedValue(note);
    repo.signClinicalNote.mockResolvedValue(signedNote);
    repo.deleteClinicalNote.mockResolvedValue(note);
  });

  it('should not write when create validation fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['bad'] });
    await createClinicalNoteCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createClinicalNote).not.toHaveBeenCalled();
  });

  it('should create with author and recorder provenance', async () => {
    await createClinicalNoteCommand('1', 'tenant-1', 'user-1', {});
    expect(repo.createClinicalNote).toHaveBeenCalledWith({
      noteTypeId: 2,
      subjective: 'Cough',
      tenantId: 'tenant-1',
      patientId: 1,
      authorUserId: 'user-1',
      recordedByUserId: 'user-1',
    });
  });

  it('should sign a note', async () => {
    await expect(signClinicalNoteCommand('4', 'tenant-1')).resolves.toMatchObject({
      success: true,
      data: { status: 'signed' },
    });
  });

  it('should not sign when validation fails', async () => {
    validateSign.mockResolvedValue({ success: false, errors: ['signed'] });
    await signClinicalNoteCommand('4', 'tenant-1');
    expect(repo.signClinicalNote).not.toHaveBeenCalled();
  });

  it('should return success payloads', async () => {
    await expect(updateClinicalNoteCommand('4', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: note,
    });
    await expect(deleteClinicalNoteCommand('4', 'tenant-1')).resolves.toEqual({
      success: true,
      data: note,
    });
  });

  it('should return not-found when update target is missing', async () => {
    repo.updateClinicalNote.mockResolvedValue(undefined);
    await expect(updateClinicalNoteCommand('4', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
