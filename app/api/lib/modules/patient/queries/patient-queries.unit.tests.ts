import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../repository/patient-repository';
import { getPatientByIdQuery } from './get-patient-by-id-query';
import { getPatientsQuery } from './get-patients-query';

vi.mock('../repository/patient-repository', () => ({
  patientRepository: {
    getPatientById: vi.fn(),
    getPatients: vi.fn(),
  },
}));

const repo = vi.mocked(patientRepository);
const patient = {
  id: 1,
  tenantId: 'tenant-1',
  mrn: 'MRN-1001',
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

describe('Patient queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientById.mockResolvedValue(patient);
    repo.getPatients.mockResolvedValue({ data: [patient], total: 1 });
  });

  it('should short-circuit and not call the repository when the id is invalid', async () => {
    await expect(getPatientByIdQuery('bad', 'tenant-1')).resolves.toMatchObject({
      success: false,
    });
    expect(repo.getPatientById).not.toHaveBeenCalled();
  });

  it('should return the patient when found', async () => {
    await expect(getPatientByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: patient,
    });
  });

  it('should return not found when the row is missing', async () => {
    repo.getPatientById.mockResolvedValue(undefined);
    await expect(getPatientByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });

  it('should short-circuit list queries and not call the repository on an invalid tenant id', async () => {
    await expect(getPatientsQuery({ tenantId: '   ' })).resolves.toMatchObject({
      success: false,
    });
    expect(repo.getPatients).not.toHaveBeenCalled();
  });

  it('should pass paging/filter params through to the repository', async () => {
    await getPatientsQuery({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'asha',
      gender: 'female',
      isActive: true,
    });
    expect(repo.getPatients).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'asha',
      gender: 'female',
      isActive: true,
    });
  });

  it('should return the list query result shape', async () => {
    await expect(getPatientsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [patient],
      total: 1,
    });
  });
});
