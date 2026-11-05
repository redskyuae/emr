import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from '../../ayurveda-diagnosis-code/repository/ayurveda-diagnosis-code-repository';
import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import { validateCreateClinicalNote } from './create-clinical-note-validator';
import { validateUpdateClinicalNote } from './update-clinical-note-validator';
import { validateSignClinicalNote } from './sign-clinical-note-validator';
import { validateDeleteClinicalNote } from './delete-clinical-note-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../clinical-note-type/repository/clinical-note-type-repository', () => ({
  clinicalNoteTypeRepository: { getClinicalNoteTypeById: vi.fn() },
}));
vi.mock('../../diagnosis-code/repository/diagnosis-code-repository', () => ({
  diagnosisCodeRepository: { getDiagnosisCodeById: vi.fn() },
}));
vi.mock('../../ayurveda-diagnosis-code/repository/ayurveda-diagnosis-code-repository', () => ({
  ayurvedaDiagnosisCodeRepository: { getAyurvedaDiagnosisCodeById: vi.fn() },
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

const codeRepo = diagnosisCodeRepository as typeof diagnosisCodeRepository & {
  getDiagnosisCodeById: Mock<typeof diagnosisCodeRepository.getDiagnosisCodeById>;
};
const ayurvedaCodeRepo =
  ayurvedaDiagnosisCodeRepository as typeof ayurvedaDiagnosisCodeRepository & {
    getAyurvedaDiagnosisCodeById: Mock<
      typeof ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById
    >;
  };

const validPayload = { noteTypeId: 2, subjective: 'Cough for 3 days' };

describe('ClinicalNote validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 1 } as never);
    noteTypeRepo.getClinicalNoteTypeById.mockResolvedValue({ id: 2 } as never);
    noteRepo.getClinicalNoteById.mockResolvedValue({ id: 4, status: 'draft' } as never);
    codeRepo.getDiagnosisCodeById.mockResolvedValue({
      id: 7,
      code: 'I10',
      isActive: true,
    } as never);
    ayurvedaCodeRepo.getAyurvedaDiagnosisCodeById.mockResolvedValue({
      id: 9,
      code: 'AYU-JVARA',
      isActive: true,
    } as never);
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

  it('should accept active coded diagnoses on create', async () => {
    const payload = { ...validPayload, diagnosisCodeId: 7, ayurvedaDiagnosisCodeId: 9 };

    await expect(validateCreateClinicalNote('1', 'tenant-1', payload)).resolves.toMatchObject({
      success: true,
    });
    expect(codeRepo.getDiagnosisCodeById).toHaveBeenCalledWith(7, 'tenant-1');
    expect(ayurvedaCodeRepo.getAyurvedaDiagnosisCodeById).toHaveBeenCalledWith(9, 'tenant-1');
  });

  it('should not look up coded diagnoses that were not supplied', async () => {
    await validateCreateClinicalNote('1', 'tenant-1', validPayload);

    expect(codeRepo.getDiagnosisCodeById).not.toHaveBeenCalled();
    expect(ayurvedaCodeRepo.getAyurvedaDiagnosisCodeById).not.toHaveBeenCalled();
  });

  it('should reject coded diagnoses that do not exist for the Tenant', async () => {
    codeRepo.getDiagnosisCodeById.mockResolvedValue(undefined);
    ayurvedaCodeRepo.getAyurvedaDiagnosisCodeById.mockResolvedValue(undefined);

    await expect(
      validateCreateClinicalNote('1', 'tenant-1', { ...validPayload, diagnosisCodeId: 7 })
    ).resolves.toEqual({
      success: false,
      errors: ['Diagnosis code 7 does not exist.'],
      status: StatusCodes.BAD_REQUEST,
    });
    await expect(
      validateCreateClinicalNote('1', 'tenant-1', { ...validPayload, ayurvedaDiagnosisCodeId: 9 })
    ).resolves.toEqual({
      success: false,
      errors: ['Ayurveda diagnosis code 9 does not exist.'],
      status: StatusCodes.BAD_REQUEST,
    });
  });

  it('should reject inactive coded diagnoses on create', async () => {
    codeRepo.getDiagnosisCodeById.mockResolvedValue({
      id: 7,
      code: 'I10',
      isActive: false,
    } as never);
    ayurvedaCodeRepo.getAyurvedaDiagnosisCodeById.mockResolvedValue({
      id: 9,
      code: 'AYU-JVARA',
      isActive: false,
    } as never);

    await expect(
      validateCreateClinicalNote('1', 'tenant-1', { ...validPayload, diagnosisCodeId: 7 })
    ).resolves.toEqual({
      success: false,
      errors: ['Diagnosis code I10 is inactive.'],
      status: StatusCodes.BAD_REQUEST,
    });
    await expect(
      validateCreateClinicalNote('1', 'tenant-1', { ...validPayload, ayurvedaDiagnosisCodeId: 9 })
    ).resolves.toEqual({
      success: false,
      errors: ['Ayurveda diagnosis code AYU-JVARA is inactive.'],
      status: StatusCodes.BAD_REQUEST,
    });
  });

  it('should let a draft note keep a code that was deactivated after it was recorded', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue({
      id: 4,
      status: 'draft',
      diagnosisCodeId: 7,
      ayurvedaDiagnosisCodeId: 9,
    } as never);
    codeRepo.getDiagnosisCodeById.mockResolvedValue({ id: 7, isActive: false } as never);

    await expect(
      validateUpdateClinicalNote(
        '4',
        { ...validPayload, diagnosisCodeId: 7, ayurvedaDiagnosisCodeId: 9 },
        'tenant-1'
      )
    ).resolves.toMatchObject({ success: true });
    expect(codeRepo.getDiagnosisCodeById).not.toHaveBeenCalled();
    expect(ayurvedaCodeRepo.getAyurvedaDiagnosisCodeById).not.toHaveBeenCalled();
  });

  it('should reject changing a draft note to an inactive code', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue({
      id: 4,
      status: 'draft',
      diagnosisCodeId: 3,
    } as never);
    codeRepo.getDiagnosisCodeById.mockResolvedValue({
      id: 7,
      code: 'I10',
      isActive: false,
    } as never);

    await expect(
      validateUpdateClinicalNote('4', { ...validPayload, diagnosisCodeId: 7 }, 'tenant-1')
    ).resolves.toMatchObject({
      success: false,
      errors: ['Diagnosis code I10 is inactive.'],
    });
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

  it('should reject deleting a signed note', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue({ id: 4, status: 'signed' } as never);
    const result = await validateDeleteClinicalNote('4', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
    expect(result.success ? [] : result.errors).toContain(
      'Clinical note 4 is signed and cannot be deleted.'
    );
  });

  it('should return not-found when deleting a missing note', async () => {
    noteRepo.getClinicalNoteById.mockResolvedValue(undefined);
    const result = await validateDeleteClinicalNote('4', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should pass deleting a draft note', async () => {
    const result = await validateDeleteClinicalNote('4', 'tenant-1');
    expect(result).toMatchObject({ success: true, data: { id: 4, tenantId: 'tenant-1' } });
  });
});
