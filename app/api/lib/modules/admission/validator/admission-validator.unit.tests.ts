import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admissionTypeRepository } from '../../admission-type/repository/admission-type-repository';
import { bedRepository } from '../../bed/repository/bed-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { visitRepository } from '../../visit/repository/visit-repository';
import { admissionRepository } from '../repository/admission-repository';
import type { Admission } from '../schemas/admission-schema';
import { validateAdmissionForClinicalCapture } from './admission-clinical-capture-validator';
import { validateAdmitPatient } from './admit-patient-validator';
import { validateCancelAdmission } from './cancel-admission-validator';
import { validateDischargeAdmission } from './discharge-admission-validator';
import { validateGetAdmissionById } from './get-admission-by-id-validator';
import { validateGetAdmissions } from './get-admissions-validator';
import { validateTransferBed } from './transfer-bed-validator';
import { validateUpdateAdmission } from './update-admission-validator';

vi.mock('../repository/admission-repository', () => ({
  admissionRepository: {
    getAdmissionById: vi.fn(),
    findActiveAdmissionByPatientId: vi.fn(),
    getAdmissionForClinicalCapture: vi.fn(),
  },
}));
vi.mock('../../admission-type/repository/admission-type-repository', () => ({
  admissionTypeRepository: { getAdmissionTypeById: vi.fn() },
}));
vi.mock('../../bed/repository/bed-repository', () => ({
  bedRepository: { getBedById: vi.fn() },
}));
vi.mock('../../doctor/repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn() },
}));
vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../visit/repository/visit-repository', () => ({
  visitRepository: { getVisitForClinicalCapture: vi.fn() },
}));

const admissionRepo = vi.mocked(admissionRepository);
const admissionTypeRepo = vi.mocked(admissionTypeRepository);
const bedRepo = vi.mocked(bedRepository);
const doctorRepo = vi.mocked(doctorRepository);
const patientRepo = vi.mocked(patientRepository);
const visitRepo = vi.mocked(visitRepository);

const admissionType = { id: 2, name: 'Emergency', code: 'EMER' };
const availableBed = { id: 9, bedNumber: 'ICU-01', status: 'AVAILABLE', wardId: 3 };
const activeDoctor = { id: 3, isActive: true };
const registeredPatient = { id: 7, isActive: true, registrationStatus: 'registered' };

const validPayload = { patientId: 7, doctorId: 3, admissionTypeId: 2, bedId: 9 };

describe('Admission validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    admissionTypeRepo.getAdmissionTypeById.mockResolvedValue(admissionType as never);
    bedRepo.getBedById.mockResolvedValue(availableBed as never);
    doctorRepo.getDoctorById.mockResolvedValue(activeDoctor as never);
    patientRepo.getPatientById.mockResolvedValue(registeredPatient as never);
    admissionRepo.findActiveAdmissionByPatientId.mockResolvedValue(undefined);
    visitRepo.getVisitForClinicalCapture.mockResolvedValue({
      id: 5,
      patientId: 7,
      status: 'COMPLETED',
    });
  });

  describe('validateAdmitPatient', () => {
    it('should not call the repositories when schema parsing fails', async () => {
      const result = await validateAdmitPatient({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(bedRepo.getBedById).not.toHaveBeenCalled();
      expect(patientRepo.getPatientById).not.toHaveBeenCalled();
    });

    it('should return conflict when the admission type does not exist', async () => {
      admissionTypeRepo.getAdmissionTypeById.mockResolvedValue(undefined);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Admission type 2 is Invalid.'],
      });
    });

    it('should return conflict when the bed does not exist', async () => {
      bedRepo.getBedById.mockResolvedValue(undefined);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Bed 9 is Invalid.'],
      });
    });

    it.each(['OCCUPIED', 'MAINTENANCE'] as const)(
      'should refuse a %s bed with the exact message',
      async (status) => {
        bedRepo.getBedById.mockResolvedValue({ ...availableBed, status } as never);

        await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
          success: false,
          status: StatusCodes.CONFLICT,
          errors: ['Bed ICU-01 is not available for admission.'],
        });
      }
    );

    it('should accept a RESERVED bed', async () => {
      bedRepo.getBedById.mockResolvedValue({ ...availableBed, status: 'RESERVED' } as never);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: true,
      });
    });

    it('should return conflict for a missing or inactive doctor', async () => {
      doctorRepo.getDoctorById.mockResolvedValue(undefined);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Doctor 3 is Invalid.'],
      });

      doctorRepo.getDoctorById.mockResolvedValue({ ...activeDoctor, isActive: false } as never);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Doctor 3 is inactive and cannot be assigned an Admission.'],
      });
    });

    it('should gate on patient existence, registration, and active state', async () => {
      patientRepo.getPatientById.mockResolvedValue(undefined);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Patient 7 is Invalid.'],
      });

      patientRepo.getPatientById.mockResolvedValue({
        ...registeredPatient,
        registrationStatus: 'provisional',
      } as never);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Patient 7 is provisional and must complete registration before admission.'],
      });

      patientRepo.getPatientById.mockResolvedValue({
        ...registeredPatient,
        isActive: false,
      } as never);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Patient 7 is inactive and cannot be admitted.'],
      });
    });

    it('should validate a linked source visit', async () => {
      visitRepo.getVisitForClinicalCapture.mockResolvedValue(undefined);

      await expect(
        validateAdmitPatient({ ...validPayload, visitId: 5 }, 'tenant-1')
      ).resolves.toMatchObject({ success: false, errors: ['Visit 5 is Invalid.'] });

      visitRepo.getVisitForClinicalCapture.mockResolvedValue({
        id: 5,
        patientId: 8,
        status: 'COMPLETED',
      });

      await expect(
        validateAdmitPatient({ ...validPayload, visitId: 5 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        errors: ['Visit 5 does not belong to patient 7.'],
      });

      visitRepo.getVisitForClinicalCapture.mockResolvedValue({
        id: 5,
        patientId: 7,
        status: 'CANCELLED',
      });

      await expect(
        validateAdmitPatient({ ...validPayload, visitId: 5 }, 'tenant-1')
      ).resolves.toMatchObject({ success: false, errors: ['Visit 5 is cancelled.'] });
    });

    it('should not look up a visit when none is supplied', async () => {
      await validateAdmitPatient(validPayload, 'tenant-1');

      expect(visitRepo.getVisitForClinicalCapture).not.toHaveBeenCalled();
    });

    it('should refuse a patient who already has an active admission', async () => {
      admissionRepo.findActiveAdmissionByPatientId.mockResolvedValue({ id: 1 } as Admission);

      await expect(validateAdmitPatient(validPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Patient 7 already has an active admission.'],
      });
    });

    it('should return the validated data with the bed number carried for messages', async () => {
      await expect(
        validateAdmitPatient(
          { ...validPayload, visitId: 5, admissionReason: 'Chest pain' },
          'tenant-1'
        )
      ).resolves.toEqual({
        success: true,
        data: {
          tenantId: 'tenant-1',
          patientId: 7,
          doctorId: 3,
          admissionTypeId: 2,
          bedId: 9,
          bedNumber: 'ICU-01',
          visitId: 5,
          remarks: undefined,
          admissionReason: 'Chest pain',
          expectedDischargeDate: undefined,
        },
      });
    });
  });

  describe('validateTransferBed', () => {
    it('should return an invalid id error without touching the bed repository', async () => {
      const result = await validateTransferBed('abc', { toBedId: 4 }, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Admission abc is Invalid.'] });
      expect(bedRepo.getBedById).not.toHaveBeenCalled();
    });

    it('should return conflict when the target bed is missing or unavailable', async () => {
      bedRepo.getBedById.mockResolvedValue(undefined);

      await expect(validateTransferBed('1', { toBedId: 4 }, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Bed 4 is Invalid.'],
      });

      bedRepo.getBedById.mockResolvedValue({ ...availableBed, status: 'OCCUPIED' } as never);

      await expect(validateTransferBed('1', { toBedId: 4 }, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Bed ICU-01 is not available for admission.'],
      });
    });

    it('should return the id and parsed payload on success', async () => {
      await expect(
        validateTransferBed('1', { toBedId: '4', reason: ' Isolation ' }, 'tenant-1')
      ).resolves.toEqual({
        success: true,
        data: { id: 1, payload: { toBedId: 4, reason: 'Isolation' } },
      });
    });
  });

  describe('validateDischargeAdmission', () => {
    it('should collect id and payload errors', () => {
      expect(validateDischargeAdmission('abc', {})).toMatchObject({
        success: false,
        errors: ['Admission abc is Invalid.', 'Discharge disposition is Invalid.'],
      });
    });

    it('should return the id and parsed payload on success', () => {
      expect(
        validateDischargeAdmission('1', {
          dischargeDisposition: 'LAMA',
          dischargeSummary: ' Left. ',
        })
      ).toEqual({
        success: true,
        data: { id: 1, payload: { dischargeDisposition: 'LAMA', dischargeSummary: 'Left.' } },
      });
    });
  });

  describe('validateCancelAdmission', () => {
    it('should require a reason', () => {
      expect(validateCancelAdmission('1', {})).toMatchObject({ success: false });
    });

    it('should return the id and parsed payload on success', () => {
      expect(validateCancelAdmission('1', { cancellationReason: 'Wrong patient' })).toEqual({
        success: true,
        data: { id: 1, payload: { cancellationReason: 'Wrong patient' } },
      });
    });
  });

  describe('validateUpdateAdmission', () => {
    const activeAdmission = { id: 1, status: 'ADMITTED', admissionNumber: 'ADM-1001' };

    beforeEach(() => {
      admissionRepo.getAdmissionById.mockResolvedValue(activeAdmission as Admission);
    });

    it('should return an invalid id error without touching the repository', async () => {
      const result = await validateUpdateAdmission('abc', {}, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Admission abc is Invalid.'] });
      expect(admissionRepo.getAdmissionById).not.toHaveBeenCalled();
    });

    it('should return not found when the admission does not exist', async () => {
      admissionRepo.getAdmissionById.mockResolvedValue(undefined);

      await expect(validateUpdateAdmission('1', {}, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it.each(['DISCHARGED', 'CANCELLED'] as const)(
      'should refuse editing a %s admission',
      async (status) => {
        admissionRepo.getAdmissionById.mockResolvedValue({
          ...activeAdmission,
          status,
        } as Admission);

        await expect(validateUpdateAdmission('1', {}, 'tenant-1')).resolves.toMatchObject({
          success: false,
          status: StatusCodes.CONFLICT,
          errors: ['Admission ADM-1001 is closed and cannot be edited.'],
        });
      }
    );

    it('should return the id and parsed payload on success', async () => {
      await expect(
        validateUpdateAdmission('1', { remarks: ' Stable ' }, 'tenant-1')
      ).resolves.toEqual({
        success: true,
        data: {
          id: 1,
          payload: {
            remarks: 'Stable',
            admissionReason: undefined,
            expectedDischargeDate: undefined,
          },
        },
      });
    });
  });

  describe('validateGetAdmissionById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetAdmissionById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Admission abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetAdmissionById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetAdmissions', () => {
    it('should reject a blank tenant id and an unknown status', () => {
      expect(validateGetAdmissions({}, '  ')).toMatchObject({ success: false });
      expect(validateGetAdmissions({ status: 'OPEN' }, 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Status is Invalid.'],
      });
    });

    it('should return the params with the tenant id stamped', () => {
      expect(validateGetAdmissions({ status: 'ADMITTED', wardId: '3' }, 'tenant-1')).toMatchObject({
        success: true,
        data: { status: 'ADMITTED', wardId: 3, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateAdmissionForClinicalCapture', () => {
    it('should reject an unknown admission', async () => {
      admissionRepo.getAdmissionForClinicalCapture.mockResolvedValue(undefined);

      await expect(validateAdmissionForClinicalCapture(9, 7, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.BAD_REQUEST,
        errors: ['Admission 9 is Invalid.'],
      });
    });

    it('should reject an admission belonging to another patient', async () => {
      admissionRepo.getAdmissionForClinicalCapture.mockResolvedValue({
        id: 9,
        patientId: 8,
        status: 'ADMITTED',
      });

      await expect(validateAdmissionForClinicalCapture(9, 7, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Admission 9 does not belong to patient 7.'],
      });
    });

    it.each(['DISCHARGED', 'CANCELLED'] as const)(
      'should reject capturing against a %s admission',
      async (status) => {
        admissionRepo.getAdmissionForClinicalCapture.mockResolvedValue({
          id: 9,
          patientId: 7,
          status,
        });

        await expect(validateAdmissionForClinicalCapture(9, 7, 'tenant-1')).resolves.toMatchObject({
          success: false,
          status: StatusCodes.CONFLICT,
          errors: ['Admission 9 is not active.'],
        });
      }
    );

    it('should pass for an active admission of the same patient', async () => {
      admissionRepo.getAdmissionForClinicalCapture.mockResolvedValue({
        id: 9,
        patientId: 7,
        status: 'ADMITTED',
      });

      await expect(validateAdmissionForClinicalCapture(9, 7, 'tenant-1')).resolves.toEqual({
        success: true,
        data: undefined,
      });
    });
  });
});
