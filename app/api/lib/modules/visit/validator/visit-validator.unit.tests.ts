import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Patient } from '../../patient/schemas/patient-schema';
import { patientRepository } from '../../patient/repository/patient-repository';
import type { Doctor } from '../../doctor/schemas/doctor-schema';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import type { AppointmentType } from '../../appointment-type/schemas/appointment-type-schema';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import type { AppointmentReason } from '../../appointment-reason/schemas/appointment-reason-schema';
import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { visitStatusRepository } from '../../visit-status/repository/visit-status-repository';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateVisitReferences } from './visit-reference-validator';
import { validateCreateVisit } from './create-visit-validator';
import { validateVisitExists } from './visit-existence-validator';
import { validateUpdateVisit } from './update-visit-validator';
import { resolveVisitTargetStatus } from './resolve-visit-target-status';
import { validateStartVisit } from './start-visit-validator';
import { validateCompleteVisit } from './complete-visit-validator';
import { validateCancelVisit } from './cancel-visit-validator';
import { validateDeleteVisit } from './delete-visit-validator';
import { validateGetVisitById } from './get-visit-by-id-validator';
import { validateGetVisits } from './get-visits-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../doctor/repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn() },
}));
vi.mock('../../appointment-type/repository/appointment-type-repository', () => ({
  appointmentTypeRepository: { getAppointmentTypeById: vi.fn() },
}));
vi.mock('../../appointment-reason/repository/appointment-reason-repository', () => ({
  appointmentReasonRepository: { getAppointmentReasonById: vi.fn() },
}));
vi.mock('../../visit-status/repository/visit-status-repository', () => ({
  visitStatusRepository: {
    getVisitStatusById: vi.fn(),
    getSystemVisitStatusByCategory: vi.fn(),
  },
}));
vi.mock('../repository/visit-repository', () => ({
  visitRepository: {
    getVisitById: vi.fn(),
    findOpenVisitByPatientId: vi.fn(),
  },
}));

const patientRepo = vi.mocked(patientRepository);
const doctorRepo = vi.mocked(doctorRepository);
const appointmentTypeRepo = vi.mocked(appointmentTypeRepository);
const appointmentReasonRepo = vi.mocked(appointmentReasonRepository);
const visitStatusRepo = vi.mocked(visitStatusRepository);
const visitRepo = vi.mocked(visitRepository);

const patient: Patient = {
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
  govtIdType: null,
  govtIdNumber: null,
  emergencyContactName: null,
  emergencyContactRelationship: null,
  emergencyContactPhone: null,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const doctor: Doctor = {
  id: 2,
  name: 'Dr. Mehta',
  email: 'mehta@example.com',
  userId: 'user-2',
  tenantId: 'tenant-1',
  createdOn: new Date(),
  modifiedOn: new Date(),
  isActive: true,
  phone: null,
  staffCode: null,
  designation: null,
  gender: null,
  dateOfBirth: null,
  specialtyId: 1,
  specialtyName: 'Cardiology',
  qualifications: null,
  registrationNumber: null,
};

const appointmentType: AppointmentType = {
  id: 3,
  name: 'New Consultation',
  code: 'NEW',
  createdOn: new Date(),
  tenantId: 'tenant-1',
  modifiedOn: new Date(),
  description: null,
};

const appointmentReason: AppointmentReason = {
  id: 4,
  name: 'Follow-up',
  code: 'FLUP',
  createdOn: new Date(),
  tenantId: 'tenant-1',
  modifiedOn: new Date(),
  description: null,
};

const waitingStatus = {
  id: 10,
  tenantId: 'tenant-1',
  name: 'Waiting',
  code: 'WAIT',
  color: '#6B7280',
  category: 'WAITING' as const,
  isSystem: true,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const inProgressStatus = {
  ...waitingStatus,
  id: 11,
  name: 'In Progress',
  code: 'INPROG',
  category: 'IN_PROGRESS' as const,
};
const completedStatus = {
  ...waitingStatus,
  id: 12,
  name: 'Completed',
  code: 'DONE',
  category: 'COMPLETED' as const,
};
const cancelledStatus = {
  ...waitingStatus,
  id: 13,
  name: 'Cancelled',
  code: 'CANC',
  category: 'CANCELLED' as const,
};

const visit: Visit = {
  id: 100,
  tenantId: 'tenant-1',
  visitNumber: 'VST-1001',
  patientId: 1,
  patient: { id: 1, name: 'Asha Rao', mrn: 'MRN-1001' },
  doctorId: 2,
  doctor: { id: 2, name: 'Dr. Mehta' },
  appointmentTypeId: 3,
  appointmentType: { id: 3, name: 'New Consultation', code: 'NEW' },
  appointmentReasonId: null,
  appointmentReason: null,
  statusId: waitingStatus.id,
  status: waitingStatus,
  chiefComplaint: null,
  notes: null,
  cancelledReason: null,
  startedOn: null,
  completedOn: null,
  cancelledOn: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Visit validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue(patient);
    doctorRepo.getDoctorById.mockResolvedValue(doctor);
    appointmentTypeRepo.getAppointmentTypeById.mockResolvedValue(appointmentType);
    appointmentReasonRepo.getAppointmentReasonById.mockResolvedValue(appointmentReason);
    visitStatusRepo.getSystemVisitStatusByCategory.mockResolvedValue(waitingStatus);
    visitStatusRepo.getVisitStatusById.mockResolvedValue(waitingStatus);
    visitRepo.getVisitById.mockResolvedValue(visit);
    visitRepo.findOpenVisitByPatientId.mockResolvedValue(undefined);
  });

  describe('validateVisitReferences', () => {
    it('should flag an invalid patient id', async () => {
      patientRepo.getPatientById.mockResolvedValue(undefined);
      const result = await validateVisitReferences('tenant-1', {
        patientId: 1,
        appointmentTypeId: 3,
      });
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Visit patient 1 is Invalid.'],
      });
    });

    it('should flag an inactive patient', async () => {
      patientRepo.getPatientById.mockResolvedValue({ ...patient, isActive: false });
      const result = await validateVisitReferences('tenant-1', {
        patientId: 1,
        appointmentTypeId: 3,
      });
      expect(result).toMatchObject({
        success: false,
        errors: ['Visit patient is Inactive and cannot be selected for a new Visit.'],
      });
    });

    it('should flag an inactive doctor', async () => {
      doctorRepo.getDoctorById.mockResolvedValue({ ...doctor, isActive: false });
      const result = await validateVisitReferences('tenant-1', {
        patientId: 1,
        doctorId: 2,
        appointmentTypeId: 3,
      });
      expect(result).toMatchObject({
        success: false,
        errors: ['Visit doctor is Inactive and cannot be assigned to a Visit.'],
      });
    });

    it('should flag an invalid appointment type', async () => {
      appointmentTypeRepo.getAppointmentTypeById.mockResolvedValue(undefined);
      const result = await validateVisitReferences('tenant-1', {
        patientId: 1,
        appointmentTypeId: 3,
      });
      expect(result).toMatchObject({
        success: false,
        errors: ['Visit appointment type 3 is Invalid.'],
      });
    });

    it('should pass when references are valid', async () => {
      const result = await validateVisitReferences('tenant-1', {
        patientId: 1,
        doctorId: 2,
        appointmentTypeId: 3,
        appointmentReasonId: 4,
      });
      expect(result).toEqual({ success: true, data: undefined });
    });
  });

  describe('validateCreateVisit', () => {
    const payload = { patientId: 1, appointmentTypeId: 3 };

    it('should return schema errors for an invalid payload', async () => {
      const result = await validateCreateVisit({}, 'tenant-1');
      expect(result).toMatchObject({ success: false });
      expect(patientRepo.getPatientById).not.toHaveBeenCalled();
    });

    it('should reject when the patient already has an open visit', async () => {
      visitRepo.findOpenVisitByPatientId.mockResolvedValue(visit);
      const result = await validateCreateVisit(payload, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: [expect.stringContaining('VST-1001')],
      });
    });

    it('should attach the waiting status id on success', async () => {
      const result = await validateCreateVisit(payload, 'tenant-1');
      expect(result).toEqual({
        success: true,
        data: { ...payload, statusId: waitingStatus.id },
      });
    });

    it('should fail when no waiting status is configured for the tenant', async () => {
      visitStatusRepo.getSystemVisitStatusByCategory.mockResolvedValue(undefined);
      const result = await validateCreateVisit(payload, 'tenant-1');
      expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
    });
  });

  describe('validateVisitExists', () => {
    it('should return not found when the visit does not exist', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);
      const result = await validateVisitExists('100', 'tenant-1');
      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should return the visit on success', async () => {
      await expect(validateVisitExists('100', 'tenant-1')).resolves.toEqual({
        success: true,
        data: visit,
      });
    });
  });

  describe('validateUpdateVisit', () => {
    const payload = { appointmentTypeId: 3 };

    it('should reject editing a completed visit', async () => {
      visitRepo.getVisitById.mockResolvedValue({ ...visit, status: completedStatus });
      const result = await validateUpdateVisit('100', payload, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Visit can no longer be edited once it is Completed or Cancelled.'],
      });
    });

    it('should return parsed id/payload plus the expected status id on success', async () => {
      await expect(validateUpdateVisit('100', payload, 'tenant-1')).resolves.toEqual({
        success: true,
        data: { id: 100, payload, expectedStatusId: waitingStatus.id },
      });
    });
  });

  describe('resolveVisitTargetStatus', () => {
    it('should resolve the system status for the category when no status id is given', async () => {
      visitStatusRepo.getSystemVisitStatusByCategory.mockResolvedValue(inProgressStatus);
      await expect(resolveVisitTargetStatus('tenant-1', 'IN_PROGRESS')).resolves.toEqual({
        success: true,
        data: inProgressStatus.id,
      });
    });

    it('should fail when no system status is configured', async () => {
      visitStatusRepo.getSystemVisitStatusByCategory.mockResolvedValue(undefined);
      const result = await resolveVisitTargetStatus('tenant-1', 'IN_PROGRESS');
      expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
    });

    it('should reject a requested status id belonging to a different category', async () => {
      visitStatusRepo.getVisitStatusById.mockResolvedValue(waitingStatus);
      const result = await resolveVisitTargetStatus('tenant-1', 'IN_PROGRESS', waitingStatus.id);
      expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
    });

    it('should accept a requested status id matching the category', async () => {
      visitStatusRepo.getVisitStatusById.mockResolvedValue(inProgressStatus);
      await expect(
        resolveVisitTargetStatus('tenant-1', 'IN_PROGRESS', inProgressStatus.id)
      ).resolves.toEqual({ success: true, data: inProgressStatus.id });
    });
  });

  describe('validateStartVisit', () => {
    it('should reject starting a visit that is not waiting', async () => {
      visitRepo.getVisitById.mockResolvedValue({ ...visit, status: inProgressStatus });
      const result = await validateStartVisit('100', {}, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Only a Visit that is Waiting can be started.'],
      });
    });

    it('should reject starting a visit with no doctor assigned', async () => {
      visitRepo.getVisitById.mockResolvedValue({ ...visit, doctorId: null, doctor: null });
      const result = await validateStartVisit('100', {}, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Visit must have a Doctor assigned before it can be started.'],
      });
    });

    it('should reject starting a visit whose assigned doctor is now inactive', async () => {
      doctorRepo.getDoctorById.mockResolvedValue({ ...doctor, isActive: false });
      const result = await validateStartVisit('100', {}, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Visit doctor is Inactive and cannot be assigned to a Visit.'],
      });
    });

    it('should reject starting a visit whose assigned doctor no longer exists', async () => {
      doctorRepo.getDoctorById.mockResolvedValue(undefined);
      const result = await validateStartVisit('100', {}, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Visit doctor is Inactive and cannot be assigned to a Visit.'],
      });
    });

    it('should resolve the in-progress status and succeed', async () => {
      visitStatusRepo.getSystemVisitStatusByCategory.mockResolvedValue(inProgressStatus);
      await expect(validateStartVisit('100', {}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: { id: 100, statusId: inProgressStatus.id, expectedStatusId: waitingStatus.id },
      });
    });
  });

  describe('validateCompleteVisit', () => {
    it('should reject completing a visit that is not in progress', async () => {
      const result = await validateCompleteVisit('100', {}, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Only a Visit that is In Progress can be completed.'],
      });
    });

    it('should resolve the completed status and succeed', async () => {
      visitRepo.getVisitById.mockResolvedValue({
        ...visit,
        statusId: inProgressStatus.id,
        status: inProgressStatus,
      });
      visitStatusRepo.getSystemVisitStatusByCategory.mockResolvedValue(completedStatus);
      await expect(validateCompleteVisit('100', {}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: { id: 100, statusId: completedStatus.id, expectedStatusId: inProgressStatus.id },
      });
    });
  });

  describe('validateCancelVisit', () => {
    it('should reject cancelling a completed visit', async () => {
      visitRepo.getVisitById.mockResolvedValue({ ...visit, status: completedStatus });
      const result = await validateCancelVisit('100', { cancelledReason: 'Left' }, 'tenant-1');
      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Only a Visit that is Waiting or In Progress can be cancelled.'],
      });
    });

    it('should require a cancelled reason', async () => {
      const result = await validateCancelVisit('100', {}, 'tenant-1');
      expect(result).toMatchObject({ success: false });
    });

    it('should resolve the cancelled status and succeed', async () => {
      visitStatusRepo.getSystemVisitStatusByCategory.mockResolvedValue(cancelledStatus);
      await expect(
        validateCancelVisit('100', { cancelledReason: 'Patient left' }, 'tenant-1')
      ).resolves.toEqual({
        success: true,
        data: {
          id: 100,
          statusId: cancelledStatus.id,
          cancelledReason: 'Patient left',
          expectedStatusId: waitingStatus.id,
        },
      });
    });
  });

  describe('validateDeleteVisit', () => {
    it('should return not found when the visit does not exist', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);
      const result = await validateDeleteVisit('100', 'tenant-1');
      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should return parsed data on success', async () => {
      await expect(validateDeleteVisit('100', 'tenant-1')).resolves.toEqual({
        success: true,
        data: { id: 100, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetVisitById / validateGetVisits', () => {
    it('should validate get-by-id and list tenant inputs', () => {
      expect(validateGetVisitById('100', 'tenant-1')).toEqual({
        success: true,
        data: { id: 100, tenantId: 'tenant-1' },
      });
      expect(validateGetVisitById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Visit abc is Invalid.'],
      });
      expect(validateGetVisits({ tenantId: 'tenant-1' })).toMatchObject({ success: true });
      expect(validateGetVisits({ tenantId: '  ' })).toMatchObject({ success: false });
    });
  });
});
