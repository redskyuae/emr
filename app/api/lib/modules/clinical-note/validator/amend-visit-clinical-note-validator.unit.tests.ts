import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import type { Visit } from '../../visit/schemas/visit-schema';
import { validateVisitForAmendment } from '../../visit/validator/visit-amendment-validator';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import type { ClinicalNote } from '../schemas/clinical-note-schema';
import { validateAmendVisitClinicalNote } from './amend-visit-clinical-note-validator';

vi.mock('../../visit/validator/visit-amendment-validator', () => ({
  validateVisitForAmendment: vi.fn(),
}));
vi.mock('../../clinical-note-type/repository/clinical-note-type-repository', () => ({
  clinicalNoteTypeRepository: { getClinicalNoteTypeById: vi.fn() },
}));
vi.mock('../repository/clinical-note-repository', () => ({
  clinicalNoteRepository: { getClinicalNoteById: vi.fn() },
}));

const validateVisit = vi.mocked(validateVisitForAmendment);
const noteTypeRepo = vi.mocked(clinicalNoteTypeRepository);
const noteRepo = vi.mocked(clinicalNoteRepository);

const signedNote = { id: 4, visitId: 1, status: 'signed' } as ClinicalNote;
const payload = { noteTypeId: 2, assessment: ' Vata imbalance ' };

describe('validateAmendVisitClinicalNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateVisit.mockResolvedValue({ success: true, data: { id: 1 } as Visit });
    noteRepo.getClinicalNoteById.mockResolvedValue(signedNote);
    noteTypeRepo.getClinicalNoteTypeById.mockResolvedValue({ id: 2 } as never);
  });

  it('should return every invalid id and schema error without repository calls', async () => {
    const result = await validateAmendVisitClinicalNote('abc', 'xyz', {}, 'tenant-1');

    expect(result).toMatchObject({ success: false });
    expect(result.success ? [] : result.errors).toEqual(
      expect.arrayContaining(['Visit abc is Invalid.', 'Clinical note xyz is Invalid.'])
    );
    expect(result).not.toHaveProperty('status');
    expect(validateVisit).not.toHaveBeenCalled();
    expect(noteRepo.getClinicalNoteById).not.toHaveBeenCalled();
  });

  it('should propagate the Visit guard failure without loading the note', async () => {
    validateVisit.mockResolvedValue({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });

    await expect(validateAmendVisitClinicalNote('1', '4', payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });
    expect(validateVisit).toHaveBeenCalledWith(1, 'tenant-1');
    expect(noteRepo.getClinicalNoteById).not.toHaveBeenCalled();
  });

  it('should return not found when the note does not exist in the Tenant', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue(undefined);

    await expect(validateAmendVisitClinicalNote('1', '4', payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Clinical note not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return not found when the note belongs to another Visit', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue({ ...signedNote, visitId: 9 });

    await expect(validateAmendVisitClinicalNote('1', '4', payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Clinical note not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(noteTypeRepo.getClinicalNoteTypeById).not.toHaveBeenCalled();
  });

  it('should reject an unknown note type', async () => {
    noteTypeRepo.getClinicalNoteTypeById.mockResolvedValue(undefined);

    await expect(validateAmendVisitClinicalNote('1', '4', payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Clinical note type 2 does not exist.'],
      status: StatusCodes.BAD_REQUEST,
    });
  });

  it('should allow amending a signed note on the Completed Visit', async () => {
    await expect(validateAmendVisitClinicalNote('1', '4', payload, 'tenant-1')).resolves.toEqual({
      success: true,
      data: {
        id: 4,
        payload: {
          noteTypeId: 2,
          subjective: undefined,
          objective: undefined,
          assessment: 'Vata imbalance',
          plan: undefined,
        },
      },
    });
    expect(noteRepo.getClinicalNoteById).toHaveBeenCalledWith(4, 'tenant-1');
  });
});
