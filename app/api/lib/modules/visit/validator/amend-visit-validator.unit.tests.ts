import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admitSourceRepository } from '../../admit-source/repository/admit-source-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import { visitTypeRepository } from '../../visit-type/repository/visit-type-repository';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateAmendVisit } from './amend-visit-validator';
import { validateVisitForAmendment } from './visit-amendment-validator';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: { getVisitById: vi.fn() },
}));
vi.mock('../../doctor/repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn() },
}));
vi.mock('../../visit-type/repository/visit-type-repository', () => ({
  visitTypeRepository: { getVisitTypeById: vi.fn() },
}));
vi.mock('../../admit-source/repository/admit-source-repository', () => ({
  admitSourceRepository: { getAdmitSourceById: vi.fn() },
}));
vi.mock('../../treatment/repository/treatment-repository', () => ({
  treatmentRepository: { getTreatmentById: vi.fn(), getTreatmentSessionById: vi.fn() },
}));

const visitRepo = vi.mocked(visitRepository);
const doctorRepo = vi.mocked(doctorRepository);
const visitTypeRepo = vi.mocked(visitTypeRepository);
const admitSourceRepo = vi.mocked(admitSourceRepository);
const treatmentRepo = vi.mocked(treatmentRepository);

const completedVisit = {
  id: 1,
  status: 'COMPLETED',
  visitNumber: 'VST-1001',
  doctor: { id: 3, name: 'Dr Mehta' },
  visitType: { id: 2, name: 'OPD Consultation', code: 'OPD' },
  admitSource: { id: 4, name: 'Doctor Referral', code: 'DOCREF' },
  treatment: { id: 10, name: 'Abhyanga Therapy', code: 'ABHY' },
  treatmentSession: { id: 20 },
} as Visit;

const unchangedPayload = {
  doctorId: 3,
  visitTypeId: 2,
  admitSourceId: 4,
  treatmentId: 10,
  treatmentSessionId: 20,
  chiefComplaint: 'Fever for 3 days',
};

describe('Visit amendment validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitRepo.getVisitById.mockResolvedValue(completedVisit);
    doctorRepo.getDoctorById.mockResolvedValue({ id: 5, isActive: true } as never);
    visitTypeRepo.getVisitTypeById.mockResolvedValue({ id: 6 } as never);
    admitSourceRepo.getAdmitSourceById.mockResolvedValue({ id: 7 } as never);
    treatmentRepo.getTreatmentById.mockResolvedValue({ id: 11 } as never);
    treatmentRepo.getTreatmentSessionById.mockResolvedValue({ id: 21, treatmentId: 11 } as never);
  });

  describe('validateVisitForAmendment', () => {
    it('should return the Completed Visit', async () => {
      await expect(validateVisitForAmendment(1, 'tenant-1')).resolves.toEqual({
        success: true,
        data: completedVisit,
      });
      expect(visitRepo.getVisitById).toHaveBeenCalledWith(1, 'tenant-1');
    });

    it('should return not found when the Visit does not exist in the Tenant', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateVisitForAmendment(1, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit not found'],
        status: StatusCodes.NOT_FOUND,
      });
    });

    it.each(['CHECKED_IN', 'IN_CONSULTATION', 'CANCELLED'] as const)(
      'should return conflict for a %s Visit',
      async (status) => {
        visitRepo.getVisitById.mockResolvedValue({ ...completedVisit, status });

        await expect(validateVisitForAmendment(1, 'tenant-1')).resolves.toEqual({
          success: false,
          errors: ['Visit VST-1001 is not completed and cannot be amended.'],
          status: StatusCodes.CONFLICT,
        });
      }
    );
  });

  describe('validateAmendVisit', () => {
    it('should return an invalid id error and not touch repositories', async () => {
      const result = await validateAmendVisit('abc', unchangedPayload, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Visit abc is Invalid.'] });
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return schema errors without a status and not touch repositories', async () => {
      const result = await validateAmendVisit('1', {}, 'tenant-1');

      expect(result).toMatchObject({ success: false });
      expect(result).not.toHaveProperty('status');
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should propagate the not found status from the Visit guard', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateAmendVisit('1', unchangedPayload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit not found'],
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return conflict for a Visit that is not Completed', async () => {
      visitRepo.getVisitById.mockResolvedValue({ ...completedVisit, status: 'CANCELLED' });

      await expect(validateAmendVisit('1', unchangedPayload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Visit VST-1001 is not completed and cannot be amended.'],
        status: StatusCodes.CONFLICT,
      });
      expect(doctorRepo.getDoctorById).not.toHaveBeenCalled();
    });

    it('should keep references the Visit already holds without looking them up', async () => {
      const result = await validateAmendVisit('1', unchangedPayload, 'tenant-1');

      expect(result).toEqual({
        success: true,
        data: {
          id: 1,
          payload: {
            doctorId: 3,
            visitTypeId: 2,
            remarks: undefined,
            treatmentId: 10,
            admitSourceId: 4,
            chiefComplaint: 'Fever for 3 days',
            treatmentSessionId: 20,
          },
        },
      });
      expect(doctorRepo.getDoctorById).not.toHaveBeenCalled();
      expect(visitTypeRepo.getVisitTypeById).not.toHaveBeenCalled();
      expect(admitSourceRepo.getAdmitSourceById).not.toHaveBeenCalled();
      expect(treatmentRepo.getTreatmentById).not.toHaveBeenCalled();
    });

    it('should validate every changed reference against the Tenant', async () => {
      const result = await validateAmendVisit(
        '1',
        { doctorId: 5, visitTypeId: 6, admitSourceId: 7, treatmentId: 11, treatmentSessionId: 21 },
        'tenant-1'
      );

      expect(result).toMatchObject({ success: true });
      expect(doctorRepo.getDoctorById).toHaveBeenCalledWith(5, 'tenant-1');
      expect(visitTypeRepo.getVisitTypeById).toHaveBeenCalledWith(6, 'tenant-1');
      expect(admitSourceRepo.getAdmitSourceById).toHaveBeenCalledWith(7, 'tenant-1');
      expect(treatmentRepo.getTreatmentById).toHaveBeenCalledWith(11, 'tenant-1');
      expect(treatmentRepo.getTreatmentSessionById).toHaveBeenCalledWith(21, 'tenant-1');
    });

    it('should accept clearing the Admit Source and Treatment without lookups', async () => {
      const result = await validateAmendVisit('1', { doctorId: 3, visitTypeId: 2 }, 'tenant-1');

      expect(result).toMatchObject({
        success: true,
        data: { payload: { admitSourceId: null, treatmentId: null, treatmentSessionId: null } },
      });
      expect(admitSourceRepo.getAdmitSourceById).not.toHaveBeenCalled();
      expect(treatmentRepo.getTreatmentById).not.toHaveBeenCalled();
    });

    it('should return conflict for an unknown Doctor', async () => {
      doctorRepo.getDoctorById.mockResolvedValue(undefined);

      await expect(
        validateAmendVisit('1', { ...unchangedPayload, doctorId: 5 }, 'tenant-1')
      ).resolves.toEqual({
        success: false,
        errors: ['Doctor 5 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return conflict when reassigning to an inactive Doctor', async () => {
      doctorRepo.getDoctorById.mockResolvedValue({ id: 5, isActive: false } as never);

      await expect(
        validateAmendVisit('1', { ...unchangedPayload, doctorId: 5 }, 'tenant-1')
      ).resolves.toEqual({
        success: false,
        errors: ['Doctor 5 is inactive and cannot be assigned a Visit.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return conflict for an unknown VisitType and Admit Source', async () => {
      visitTypeRepo.getVisitTypeById.mockResolvedValue(undefined);
      admitSourceRepo.getAdmitSourceById.mockResolvedValue(undefined);

      await expect(
        validateAmendVisit(
          '1',
          { ...unchangedPayload, visitTypeId: 6, admitSourceId: 7 },
          'tenant-1'
        )
      ).resolves.toEqual({
        success: false,
        errors: ['Visit type 6 is Invalid.', 'Admit source 7 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return conflict for an unknown Treatment and Session', async () => {
      treatmentRepo.getTreatmentById.mockResolvedValue(undefined);
      treatmentRepo.getTreatmentSessionById.mockResolvedValue(undefined);

      await expect(
        validateAmendVisit(
          '1',
          { ...unchangedPayload, treatmentId: 11, treatmentSessionId: 21 },
          'tenant-1'
        )
      ).resolves.toEqual({
        success: false,
        errors: ['Treatment 11 is Invalid.', 'Treatment session 21 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return conflict when the Session belongs to another Treatment', async () => {
      treatmentRepo.getTreatmentSessionById.mockResolvedValue({ id: 21, treatmentId: 99 } as never);

      await expect(
        validateAmendVisit(
          '1',
          { ...unchangedPayload, treatmentId: 11, treatmentSessionId: 21 },
          'tenant-1'
        )
      ).resolves.toEqual({
        success: false,
        errors: ['Treatment session does not belong to the selected Treatment.'],
        status: StatusCodes.CONFLICT,
      });
    });
  });
});
