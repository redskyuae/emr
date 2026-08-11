import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../repository/patient-repository';
import { validateCreatePatient } from '../validator/create-patient-validator';
import { validatePatientExists } from '../validator/patient-existence-validator';
import { validateUpdatePatient } from '../validator/update-patient-validator';
import { createPatientCommand } from './create-patient-command';
import { deactivatePatientCommand } from './deactivate-patient-command';
import { deletePatientCommand } from './delete-patient-command';
import { reactivatePatientCommand } from './reactivate-patient-command';
import { updatePatientCommand } from './update-patient-command';

vi.mock('../repository/patient-repository', () => ({
  patientRepository: {
    createPatient: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    setPatientActive: vi.fn(),
  },
}));
vi.mock('../validator/create-patient-validator', () => ({ validateCreatePatient: vi.fn() }));
vi.mock('../validator/update-patient-validator', () => ({ validateUpdatePatient: vi.fn() }));
vi.mock('../validator/patient-existence-validator', () => ({ validatePatientExists: vi.fn() }));

const repo = vi.mocked(patientRepository);
const validateCreate = vi.mocked(validateCreatePatient);
const validateUpdate = vi.mocked(validateUpdatePatient);
const validateExists = vi.mocked(validatePatientExists);

const createInput = {
  title: 'mrs' as const,
  firstName: 'Asha',
  lastName: 'Rao',
  gender: 'female' as const,
  dateOfBirth: '1990-05-14',
  phone: '9876543210',
};

const patient = {
  id: 1,
  tenantId: 'tenant-1',
  mrn: 'MRN-1001',
  title: 'mrs' as const,
  firstName: 'Asha',
  middleName: null,
  lastName: 'Rao',
  gender: 'female' as const,
  dateOfBirth: '1990-05-14',
  bloodGroup: null,
  maritalStatus: null,
  preferredPaymentMethod: null,
  phone: '9876543210',
  registrationStatus: 'registered' as const,
  alternatePhone: null,
  email: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  stateId: null,
  state: null,
  countryId: null,
  country: null,
  postalCode: null,
  nationalityId: null,
  nationality: null,
  languageId: null,
  language: null,
  religionId: null,
  religion: null,
  race: null,
  ethnicGroup: null,
  emiratesId: null,
  photoUrl: null,
  patientIdentificationCategory: null,
  passportNumber: null,
  uid: null,
  isVip: false,
  smsConsent: false,
  isMedicalTourist: false,
  identityDocuments: [],
  emergencyContactName: null,
  emergencyContactRelationship: null,
  emergencyContactGender: null,
  emergencyContactPhone: null,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Patient commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: createInput });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload: createInput } });
    validateExists.mockResolvedValue({ success: true, data: 1 });
    repo.createPatient.mockResolvedValue(patient);
    repo.updatePatient.mockResolvedValue(patient);
    repo.deletePatient.mockResolvedValue(patient);
    repo.setPatientActive.mockResolvedValue(patient);
  });

  it('should return validation failure and not write when create validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createPatientCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createPatient).not.toHaveBeenCalled();
  });

  it('should create the patient with tenant id on success', async () => {
    await expect(createPatientCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: patient,
    });
    expect(repo.createPatient).toHaveBeenCalledWith({ ...createInput, tenantId: 'tenant-1' });
  });

  it('should map a duplicate Emirates ID constraint on create to a conflict error', async () => {
    validateCreate.mockResolvedValue({
      success: true,
      data: { ...createInput, emiratesId: '784199012345671' },
    });
    repo.createPatient.mockRejectedValue({
      cause: { code: '23505', constraint: 'patient_tenant_emirates_id_idx' },
    });
    await expect(createPatientCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Emirates ID 784199012345671 already exists.'],
    });
  });

  it('should map a duplicate MRN constraint on create to a conflict error', async () => {
    repo.createPatient.mockRejectedValue({
      cause: { code: '23505', constraint: 'patient_tenant_mrn_idx' },
    });
    await expect(createPatientCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient MRN allocation conflicted. Please retry.'],
    });
  });

  it('should rethrow unknown create errors', async () => {
    const error = new Error('database down');
    repo.createPatient.mockRejectedValue(error);
    await expect(createPatientCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should update the patient on success', async () => {
    await expect(updatePatientCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: patient,
    });
  });

  it('should return not found when update repository returns nothing', async () => {
    repo.updatePatient.mockResolvedValue(undefined);
    await expect(updatePatientCommand('1', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return validation failure and not write when update validator fails', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Patient not found'],
      status: 404,
    });
    const result = await updatePatientCommand('1', 'tenant-1', {});
    expect(result).toEqual({ success: false, errors: ['Patient not found'], status: 404 });
    expect(repo.updatePatient).not.toHaveBeenCalled();
  });

  it('should delete the patient on success', async () => {
    await expect(deletePatientCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: undefined,
    });
  });

  it('should return validation failure and not delete when the existence validator fails', async () => {
    validateExists.mockResolvedValue({ success: false, errors: ['Patient 1 is Invalid.'] });
    const result = await deletePatientCommand('1', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Patient 1 is Invalid.'] });
    expect(repo.deletePatient).not.toHaveBeenCalled();
  });

  it('should deactivate the patient on success', async () => {
    await expect(deactivatePatientCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: patient,
    });
    expect(repo.setPatientActive).toHaveBeenCalledWith(1, 'tenant-1', false);
  });

  it('should reactivate the patient on success', async () => {
    await expect(reactivatePatientCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: patient,
    });
    expect(repo.setPatientActive).toHaveBeenCalledWith(1, 'tenant-1', true);
  });

  it('should return not found when deactivate repository returns nothing', async () => {
    repo.setPatientActive.mockResolvedValue(undefined);
    await expect(deactivatePatientCommand('1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
