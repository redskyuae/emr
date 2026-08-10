import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { countryRepository } from '../../country/repository/country-repository';
import { languageRepository } from '../../language/repository/language-repository';
import { nationalityRepository } from '../../nationality/repository/nationality-repository';
import { religionRepository } from '../../religion/repository/religion-repository';
import { stateRepository } from '../../state/repository/state-repository';
import { patientRepository } from '../repository/patient-repository';
import { validateCreatePatient } from './create-patient-validator';
import { validateGetPatientById } from './get-patient-by-id-validator';
import { validateGetPatients } from './get-patients-validator';
import { validatePatientExists } from './patient-existence-validator';
import { validatePatientEmiratesIdUniqueness } from './patient-emirates-id-validator';
import { validatePatientReferences } from './patient-reference-validator';
import { validateUpdatePatient } from './update-patient-validator';

vi.mock('../repository/patient-repository', () => ({
  patientRepository: {
    getPatientById: vi.fn(),
    findActiveByEmiratesId: vi.fn(),
  },
}));
vi.mock('../../country/repository/country-repository', () => ({
  countryRepository: { getCountryById: vi.fn() },
}));
vi.mock('../../state/repository/state-repository', () => ({
  stateRepository: { getStateById: vi.fn() },
}));
vi.mock('../../nationality/repository/nationality-repository', () => ({
  nationalityRepository: { getNationalityById: vi.fn() },
}));
vi.mock('../../language/repository/language-repository', () => ({
  languageRepository: { getLanguageById: vi.fn() },
}));
vi.mock('../../religion/repository/religion-repository', () => ({
  religionRepository: { getReligionById: vi.fn() },
}));

const repo = vi.mocked(patientRepository);
const country = vi.mocked(countryRepository);
const state = vi.mocked(stateRepository);
const nationality = vi.mocked(nationalityRepository);
const language = vi.mocked(languageRepository);
const religion = vi.mocked(religionRepository);

const existing = {
  id: 1,
  tenantId: 'tenant-1',
  mrn: 'MRN-1001',
  firstName: 'Asha',
  middleName: null,
  lastName: 'Rao',
  gender: 'female',
  dateOfBirth: '1990-05-14',
  bloodGroup: null,
  maritalStatus: null,
  preferredPaymentMethod: null,
  phone: '9876543210',
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
} as never;

const validPayload = {
  firstName: 'Asha',
  lastName: 'Rao',
  gender: 'female',
  dateOfBirth: '1990-05-14',
  phone: '9876543210',
  emiratesId: '784199012345671',
};

describe('Patient reference validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return conflict when a referenced nationality does not exist', async () => {
    nationality.getNationalityById.mockResolvedValue(undefined);
    const result = await validatePatientReferences({ nationalityId: 99 });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient nationality 99 is Invalid.'],
    });
  });

  it('should return conflict when a state does not belong to the given country', async () => {
    state.getStateById.mockResolvedValue({ id: 5, name: 'Karnataka', countryId: 2 } as never);
    country.getCountryById.mockResolvedValue({ id: 1, name: 'India', code: 'IN' } as never);
    const result = await validatePatientReferences({ stateId: 5, countryId: 1 });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient state 5 does not belong to country 1.'],
    });
  });

  it('should return conflict when a referenced language does not exist', async () => {
    language.getLanguageById.mockResolvedValue(undefined);
    const result = await validatePatientReferences({ languageId: 7 });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient language 7 is Invalid.'],
    });
  });

  it('should return conflict when a referenced religion does not exist', async () => {
    religion.getReligionById.mockResolvedValue(undefined);
    const result = await validatePatientReferences({ religionId: 3 });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient religion 3 is Invalid.'],
    });
  });

  it('should succeed when no references are provided', async () => {
    await expect(validatePatientReferences({})).resolves.toEqual({
      success: true,
      data: undefined,
    });
  });
});

describe('Patient Emirates ID uniqueness validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip the uniqueness check when no Emirates ID is provided', async () => {
    await validatePatientEmiratesIdUniqueness({ tenantId: 'tenant-1' });
    expect(repo.findActiveByEmiratesId).not.toHaveBeenCalled();
  });

  it('should return conflict when the Emirates ID already exists for the tenant', async () => {
    repo.findActiveByEmiratesId.mockResolvedValue({ id: 2, emiratesId: '784199012345671' });
    const result = await validatePatientEmiratesIdUniqueness({
      tenantId: 'tenant-1',
      emiratesId: '784199012345671',
    });
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Emirates ID 784199012345671 already exists.'],
    });
  });
});

describe('Patient create validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByEmiratesId.mockResolvedValue(undefined);
  });

  it('should not call reference or uniqueness checks when schema parsing fails', async () => {
    await validateCreatePatient({}, 'tenant-1');
    expect(country.getCountryById).not.toHaveBeenCalled();
    expect(repo.findActiveByEmiratesId).not.toHaveBeenCalled();
  });

  it('should return success for a valid payload', async () => {
    const result = await validateCreatePatient(validPayload, 'tenant-1');
    expect(result).toMatchObject({ success: true, data: { firstName: 'Asha' } });
  });

  it('should propagate reference conflicts', async () => {
    nationality.getNationalityById.mockResolvedValue(undefined);
    const result = await validateCreatePatient({ ...validPayload, nationalityId: 5 }, 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
  });

  it('should propagate Emirates ID conflicts', async () => {
    repo.findActiveByEmiratesId.mockResolvedValue({ id: 2, emiratesId: '784199012345671' });
    const result = await validateCreatePatient(
      { ...validPayload, emiratesId: '784199012345671' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
  });
});

describe('Patient update validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientById.mockResolvedValue(existing);
    repo.findActiveByEmiratesId.mockResolvedValue(undefined);
  });

  it('should return not found when the patient does not exist', async () => {
    repo.getPatientById.mockResolvedValue(undefined);
    const result = await validateUpdatePatient('1', 'tenant-1', validPayload);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should pass excludeId to the Emirates ID uniqueness check', async () => {
    await validateUpdatePatient('1', 'tenant-1', {
      ...validPayload,
      emiratesId: '784199012345671',
    });
    expect(repo.findActiveByEmiratesId).toHaveBeenCalledWith('tenant-1', '784199012345671', {
      excludeId: 1,
    });
  });

  it('should return validation errors without calling the repository when the id is invalid', async () => {
    const result = await validateUpdatePatient('bad', 'tenant-1', validPayload);
    expect(result.success).toBe(false);
    expect(repo.getPatientById).not.toHaveBeenCalled();
  });
});

describe('Get patient by id validator', () => {
  it('should require a valid id and tenant id', () => {
    expect(validateGetPatientById('bad', 'tenant-1').success).toBe(false);
    expect(validateGetPatientById('1', '   ').success).toBe(false);
    expect(validateGetPatientById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
  });
});

describe('Get patients validator', () => {
  it('should require a non-empty tenant id', () => {
    expect(validateGetPatients('   ').success).toBe(false);
    expect(validateGetPatients('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
  });
});

describe('Patient existence validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return not found when the patient does not exist', async () => {
    repo.getPatientById.mockResolvedValue(undefined);
    const result = await validatePatientExists('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return the id when the patient exists', async () => {
    repo.getPatientById.mockResolvedValue(existing);
    await expect(validatePatientExists('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: 1,
    });
  });
});
