import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { visitRepository } from '../../visit/repository/visit-repository';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import {
  validateStartPatientTreatmentPlanSession,
  validateUpdatePatientTreatmentPlanSession,
} from './patient-treatment-plan-session-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../visit/repository/visit-repository', () => ({
  visitRepository: { getVisitById: vi.fn() },
}));
vi.mock('../repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { getCurrentByPatientId: vi.fn() },
}));

const patientRepo = vi.mocked(patientRepository);
const visitRepo = vi.mocked(visitRepository);
const planRepo = vi.mocked(patientTreatmentPlanRepository);

const params = {
  patientId: '12',
  tenantId: 'tenant-a',
  patientTreatmentPlanId: '44',
  patientTreatmentPlanSessionId: '102',
};
const target = {
  patientId: 12,
  tenantId: 'tenant-a',
  patientTreatmentPlanId: 44,
  patientTreatmentPlanSessionId: 102,
};

function session(id: number, sessionNumber: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    sessionNumber,
    completionStatus: 'PENDING',
    completedVisitId: null,
    startedVisitId: null,
    reservedAppointment: null,
    ...overrides,
  };
}

function reservedFor(bookingNumber: string) {
  return {
    isReserved: true,
    reservedAppointment: { bookingNumber, slotDate: '2026-11-10', startTime: null, endTime: null },
  };
}

function mockPlan(...sessions: ReturnType<typeof session>[]) {
  planRepo.getCurrentByPatientId.mockResolvedValue([{ id: 44, sessions }] as never);
}

function mockVisit(overrides: Record<string, unknown> = {}) {
  visitRepo.getVisitById.mockResolvedValue({
    id: 5120,
    status: 'IN_CONSULTATION',
    patient: { id: 12 },
    appointment: null,
    ...overrides,
  } as never);
}

describe('Patient Treatment Plan Session validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 12 } as never);
    mockPlan(session(101, 1), session(102, 2));
    mockVisit();
  });

  describe('validateUpdatePatientTreatmentPlanSession', () => {
    it('should reject invalid IDs and plan fields without reading the repository', async () => {
      const result = await validateUpdatePatientTreatmentPlanSession(
        {
          ...params,
          patientId: 'abc',
          patientTreatmentPlanId: '0',
          patientTreatmentPlanSessionId: 'x',
        },
        { durationMinutes: 0 }
      );

      expect(result).toEqual({
        success: false,
        errors: [
          'Patient abc is Invalid.',
          'Patient Treatment Plan 0 is Invalid.',
          'Patient Treatment Plan Session x is Invalid.',
          'Duration minutes must be at least 1',
        ],
      });
      expect(patientRepo.getPatientById).not.toHaveBeenCalled();
      expect(planRepo.getCurrentByPatientId).not.toHaveBeenCalled();
    });

    it('should return not found when the Patient does not exist in the Tenant', async () => {
      patientRepo.getPatientById.mockResolvedValue(undefined);

      await expect(
        validateUpdatePatientTreatmentPlanSession(params, { warning: 'Avoid the left knee.' })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Patient not found'],
      });
      expect(planRepo.getCurrentByPatientId).not.toHaveBeenCalled();
    });

    it('should return not found for a Plan that is not current for the Patient', async () => {
      planRepo.getCurrentByPatientId.mockResolvedValue([]);

      await expect(
        validateUpdatePatientTreatmentPlanSession(params, { warning: 'Avoid the left knee.' })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Patient Treatment Plan not found'],
      });
      expect(planRepo.getCurrentByPatientId).toHaveBeenCalledWith(12, 'tenant-a');
    });

    it('should return not found for a Session outside the Plan', async () => {
      mockPlan(session(101, 1));

      await expect(
        validateUpdatePatientTreatmentPlanSession(params, { warning: 'Avoid the left knee.' })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Patient Treatment Plan Session not found'],
      });
    });

    it('should reject editing a completed Session', async () => {
      mockPlan(session(102, 2, { completionStatus: 'COMPLETED' }));

      await expect(
        validateUpdatePatientTreatmentPlanSession(params, { warning: 'Avoid the left knee.' })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Session 2 is already completed.'],
      });
    });

    it('should reject editing a Session that is In Progress in a Visit', async () => {
      mockPlan(session(102, 2, { startedVisitId: 5120 }));

      await expect(
        validateUpdatePatientTreatmentPlanSession(params, { warning: 'Avoid the left knee.' })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Session 2 is in progress and cannot be edited.'],
      });
    });

    it('should return the normalized target and Session plan', async () => {
      await expect(
        validateUpdatePatientTreatmentPlanSession(
          { ...params, tenantId: ' tenant-a ' },
          { procedure: ' Abhyanga ', warning: '' }
        )
      ).resolves.toEqual({
        success: true,
        data: { ...target, plan: { procedure: 'Abhyanga', warning: null } },
      });
    });
  });

  describe('validateStartPatientTreatmentPlanSession', () => {
    it('should reject a missing Visit ID without reading the repository', async () => {
      await expect(validateStartPatientTreatmentPlanSession(params, {})).resolves.toMatchObject({
        success: false,
      });
      expect(patientRepo.getPatientById).not.toHaveBeenCalled();
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return not found for a Visit of another Patient', async () => {
      mockVisit({ patient: { id: 99 } });

      await expect(
        validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Visit not found'],
      });
      expect(visitRepo.getVisitById).toHaveBeenCalledWith(5120, 'tenant-a');
    });

    it('should return not found for a missing Visit', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(
        validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Visit not found'],
      });
    });

    it('should reject a Visit that is not Checked In or In Consultation', async () => {
      for (const status of ['COMPLETED', 'CANCELLED']) {
        mockVisit({ status });

        await expect(
          validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
        ).resolves.toEqual({
          success: false,
          status: StatusCodes.CONFLICT,
          errors: ['Visit must be Checked In or In Consultation to start a Session.'],
        });
      }
    });

    it('should reject a completed or already started Session', async () => {
      mockPlan(session(102, 2, { completionStatus: 'COMPLETED' }));
      await expect(
        validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Session 2 is already completed.'],
      });
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();

      mockPlan(session(102, 2, { startedVisitId: 4000 }));
      await expect(
        validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Session 2 is already in progress.'],
      });
    });

    it('should reject a Session booked for another Appointment', async () => {
      mockPlan(session(102, 2, reservedFor('APT-2026-0042')));
      mockVisit({ appointment: { id: 7, bookingNumber: 'APT-2026-0050' } });

      await expect(
        validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
      ).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Session 2 is booked for Appointment APT-2026-0042.'],
      });
    });

    it('should allow the Session booked for this Visit Appointment', async () => {
      mockPlan(session(101, 1), session(102, 2, reservedFor('APT-2026-0042')));
      mockVisit({ appointment: { id: 7, bookingNumber: 'APT-2026-0042' } });

      await expect(
        validateStartPatientTreatmentPlanSession(params, { visitId: '5120' })
      ).resolves.toEqual({ success: true, data: { ...target, visitId: 5120 } });
    });

    it('should reject a second Session of the same Plan in one Visit', async () => {
      const cases = [
        session(101, 1, { startedVisitId: 5120 }),
        session(101, 1, { completionStatus: 'COMPLETED', completedVisitId: 5120 }),
        session(101, 1, reservedFor('APT-2026-0042')),
      ];
      mockVisit({ appointment: { id: 7, bookingNumber: 'APT-2026-0042' } });

      for (const other of cases) {
        mockPlan(other, session(102, 2));

        await expect(
          validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
        ).resolves.toEqual({
          success: false,
          status: StatusCodes.CONFLICT,
          errors: ['This Visit already has Session 1 of this Patient Treatment Plan.'],
        });
      }
    });

    it('should return the normalized target and Visit for a walk-in Visit', async () => {
      await expect(
        validateStartPatientTreatmentPlanSession(params, { visitId: 5120 })
      ).resolves.toEqual({ success: true, data: { ...target, visitId: 5120 } });
    });
  });
});
