import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import { validateCreateClinicalNote } from './create-clinical-note-validator';
import { validateUpdateClinicalNote } from './update-clinical-note-validator';
import { validateSignClinicalNote } from './sign-clinical-note-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../clinical-note-type/repository/clinical-note-type-repository', () => ({
  clinicalNoteTypeRepository: { getClinicalNoteTypeById: vi.fn() },
}));
vi.mock('../repository/clinical-note-repository', () => ({
  clinicalNoteRepository: { getClinicalNoteById: vi.fn() },
}));

const patientRepo = patientRepository as typeof patientRepository & {
  getPatientById: Mock<typeof patientRepository.getPatientById>;
};
const noteTypeRepo = clinicalNoteTypeRepository as typeof clinicalNoteTypeRepository & {
  getClinicalNoteTypeById: Mock<typeof clinicalNoteTypeRepository.getClinicalNoteTypeById>;
};
const noteRepo = clinicalNoteRepository as typeof clinicalNoteRepository & {
  getClinicalNoteById: Mock<typeof clinicalNoteRepository.getClinicalNoteById>;
};

const validPayload = { noteTypeId: 2, subjective: 'Cough for 3 days' };

describe('ClinicalNote validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 1 } as never);
    noteTypeRepo.getClinicalNoteTypeById.mockResolvedValue({ id: 2 } as never);
    noteRepo.getClinicalNoteById.mockResolvedValue({ id: 4, status: 'draft' } as never);
  });

  it('should skip reference checks when the payload is invalid', async () => {
    const result = await validateCreateClinicalNote('1', 'tenant-1', {});
    expect(result.success).toBe(false);
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
    expect(noteTypeRepo.getClinicalNoteTypeById).not.toHaveBeenCalled();
  });

  it('should return not-found when patient is missing', async () => {
    patientRepo.getPatientById.mockResolvedValue(undefined);
    const result = await validateCreateClinicalNote('1', 'tenant-1', validPayload);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should reject a missing note type reference', async () => {
    noteTypeRepo.getClinicalNoteTypeById.mockResolvedValue(undefined);
    const result = await validateCreateClinicalNote('1', 'tenant-1', validPayload);
    expect(result).toMatchObject({ success: false, status: StatusCodes.BAD_REQUEST });
    expect(result.success ? [] : result.errors).toContain('Clinical note type 2 does not exist.');
  });

  it('should pass on a valid create', async () => {
    const result = await validateCreateClinicalNote('1', 'tenant-1', validPayload);
    expect(result).toMatchObject({ success: true, data: { patientId: 1 } });
  });

  it('should reject editing a signed note', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue({ id: 4, status: 'signed' } as never);
    const result = await validateUpdateClinicalNote('4', validPayload, 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
    expect(result.success ? [] : result.errors).toContain(
      'Clinical note 4 is signed and cannot be edited.'
    );
  });

  it('should reject signing an already-signed note', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue({ id: 4, status: 'signed' } as never);
    const result = await validateSignClinicalNote('4', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
  });

  it('should pass signing a draft note', async () => {
    const result = await validateSignClinicalNote('4', 'tenant-1');
    expect(result).toMatchObject({ success: true, data: { id: 4, tenantId: 'tenant-1' } });
  });
});
